const _ = require('lodash')
const BigNumber = require('bignumber.js')
const { v4: uuid } = require('uuid')

const Exchange = require('../base')
const BalanceManager = require('./balanceManager')
const { ValidationError } = require('../../errors')
const { validate } = require('../../validator')
const { ExchangeOrder, Trade } = require('../../models')

class SimulationExchangeError extends ValidationError {
  constructor (message, type, data) {
    super(message, 'SIMULATION_EXCHANGE_ERROR')
  }
}

const down = BigNumber.ROUND_DOWN
const up = BigNumber.ROUND_UP

class Simulation extends Exchange {
  #tick
  #candle
  #balanceManager

  constructor (options = {}) {
    super(options)

    this.#balanceManager = new BalanceManager(this.balances)
  }

  setTick (tick) {
    const params = { tick }
    const valid = validate(params, {
      tick: { type: 'number', required: true, convert: true, custom: (...args) => ExchangeOrder.convertToBigNumber(...args) }
    })

    if (valid !== true) {
      throw new ValidationError(undefined, undefined, valid)
    }

    this.#tick = params.tick
  }

  getTick () {
    return this.#tick
  }

  setCandle (candle = {}) {
    const valid = validate({ candle }, {
      candle: {
        type: 'object',
        required: true,
        props: {
          open: { type: 'number', required: true, convert: true, custom: (...args) => ExchangeOrder.convertToBigNumber(...args) },
          high: { type: 'number', required: true, convert: true, custom: (...args) => ExchangeOrder.convertToBigNumber(...args) },
          low: { type: 'number', required: true, convert: true, custom: (...args) => ExchangeOrder.convertToBigNumber(...args) },
          close: { type: 'number', required: true, convert: true, custom: (...args) => ExchangeOrder.convertToBigNumber(...args) }
        }
      }
    })

    if (valid !== true) {
      throw new ValidationError('Evaluation error', null, valid)
    }

    this.#candle = candle
  }

  getCandle () {
    return this.#candle
  }

  createOrder (options = {}) {
    this.#validateAndSanitizeOrderOptions(options)

    const market = this.getMarket(options.market)
    const basePrecision = market.precision.amount
    const quotePrecision = market.precision.price

    const price = options.price ? BigNumber(options.price).toFixed(quotePrecision, down) : undefined
    let baseQuantity = options.baseQuantity
    let quoteQuantity = options.quoteQuantity

    if (!quoteQuantity && baseQuantity && price) {
      quoteQuantity = this.#determineQuoteQuantityFromBase(options.baseQuantity, price, quotePrecision)
    }

    if (!baseQuantity && quoteQuantity && price) {
      baseQuantity = this.#determineBaseQuantityFromQuote(options.quoteQuantity, price, basePrecision)
    }

    const order = new ExchangeOrder({
      id: uuid(),
      status: ExchangeOrder.statuses.NEW,
      ..._.pick(options, [
        'timestamp',
        'exchange',
        'market',
        'side',
        'type'
      ]),
      baseQuantity,
      quoteQuantity,
      price,
      ..._.pick(options, [
        'stopPrice'
      ])
    })

    this.#evaluateNew(order)
    this.orders.push(order)

    return order
  }

  cancelOrder (params = {}) {
    this.#validateAndSanitizeCancelOrderParams(params)

    const order = this.orders.find(order => order.id === params.id)
    const market = this.getMarket(order.market)

    this.#balanceManager.unlockFromOrder(order, market)

    order.set({ status: ExchangeOrder.statuses.CANCELLED })
  }

  evaluate () {
    this.#verifyTickAndCandle()

    const orders = this.getOrders().filter(order => {
      return ![ExchangeOrder.statuses.FILLED, ExchangeOrder.statuses.CANCELLED].includes(order.status)
    })

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]

      this.#evaluateExisting(order)
    }
  }

  #evaluateNew (order = {}) {
    const trade = this.#emulateTrade(order)
    const market = this.getMarket(order.market)

    if (order.type === ExchangeOrder.types.MARKET) {
      this.#addTradeToOrder(order, trade)
      this.#balanceManager.updateFromOrder(order, market)
    } else {
      this.#balanceManager.lockFromOrder(order, market)
      order.set({ status: ExchangeOrder.statuses.OPEN })
    }
  }

  #evaluateExisting (order = {}) {
    if (order.stopPrice && !order.stopPriceHit && this.#priceInCurrentCandle(order.stopPrice)) {
      order.set({ stopPriceHit: true })
      return
    }

    const isStopAndHasHit = order.stopPrice && order.stopPriceHit
    const emulateMarketTrade = isStopAndHasHit && ExchangeOrder.isMarketOrder(order)
    const emulateLimitTrade = ExchangeOrder.isLimitOrder(order) && this.#priceInCurrentCandle(order.price)

    if (emulateMarketTrade || (isStopAndHasHit && emulateLimitTrade) || (!order.stopPrice && emulateLimitTrade)) {
      const market = this.getMarket(order.market)
      const trade = this.#emulateTrade(order)

      this.#addTradeToOrder(order, trade)

      this.#balanceManager.unlockFromOrder(order, market)
      this.#balanceManager.updateFromOrder(order, market)
    }
  }

  #addTradeToOrder (order = {}, trade = {}) {
    const market = this.getMarket(order.market)
    const quotePrecision = market.precision.price
    const price = order.price ? BigNumber(order.price).toFixed(quotePrecision, down) : undefined

    order.set({
      status: ExchangeOrder.statuses.FILLED,
      baseQuantityGross: trade.baseQuantityGross,
      baseQuantityNet: trade.baseQuantityNet,
      quoteQuantityGross: trade.quoteQuantityGross,
      quoteQuantityNet: trade.quoteQuantityNet,
      price,
      averagePrice: trade.price
    })

    order.trades.push(trade)
  }

  #priceInCurrentCandle (price) {
    if (BigNumber(this.#candle.high).isGreaterThan(price) && BigNumber(this.#candle.low).isLessThan(price)) {
      return true
    }

    return false
  }

  #emulateTrade (order = {}) {
    const market = this.getMarket(order.market)
    const basePrecision = market.precision.amount
    const quotePrecision = market.precision.price
    const price = ExchangeOrder.isMarketOrder(order)
      ? this.#simulateSlippagePrice(quotePrecision)
      : BigNumber(order.price).toFixed(quotePrecision, down)

    let baseQuantityGross = 0
    let baseQuantityNet = 0
    let quoteQuantityGross = 0
    let quoteQuantityNet = 0
    let fee = {}

    // Base quantity is always rounded down to precision, we can't round up.
    if (order.baseQuantity) {
      baseQuantityGross = BigNumber(order.baseQuantity).toFixed(basePrecision, down)
    } else if (order.quoteQuantity) {
      baseQuantityGross = this.#determineBaseQuantityFromQuote(order.quoteQuantity, price, basePrecision)
    }

    // If base quantity is less/greater than market min/max, we need to throw an error
    this.#validateQuantityAgainstMarketLimits('baseQuantity', 'amount', market, baseQuantityGross)

    // Quote quantity is always rounded up to precision
    quoteQuantityGross = BigNumber(baseQuantityGross).multipliedBy(price).toFixed(quotePrecision, up)

    // If quote quantity is less/greater than market min/max, we need to throw an error
    this.#validateQuantityAgainstMarketLimits('quoteQuantity', 'cost', market, quoteQuantityGross)

    if (order.side === ExchangeOrder.sides.BUY) {
      const feeCost = BigNumber(baseQuantityGross).multipliedBy(market.fees.taker).toFixed()

      fee = { currency: market.base, cost: feeCost }
      baseQuantityNet = BigNumber(baseQuantityGross).minus(feeCost).toFixed(basePrecision, down)
      quoteQuantityNet = quoteQuantityGross
    } else if (order.side === ExchangeOrder.sides.SELL) {
      const feeCost = BigNumber(quoteQuantityGross).multipliedBy(market.fees.taker).toFixed()

      fee = { currency: market.quote, cost: feeCost }
      baseQuantityNet = baseQuantityGross
      quoteQuantityNet = BigNumber(quoteQuantityGross).minus(feeCost).toFixed(quotePrecision, up)
    }

    return new Trade({
      foreignId: uuid(),
      baseQuantityGross,
      baseQuantityNet,
      quoteQuantityGross,
      quoteQuantityNet,
      price,
      fee
    })
  }

  #simulateSlippagePrice (precision) {
    this.#verifyTickAndCandle()

    const high = BigNumber(this.#tick).multipliedBy(1.001)
    const low = BigNumber(this.#tick).multipliedBy(0.999)

    return BigNumber(_.random(low, high, true)).toFixed(precision, down)
  }

  #determineBaseQuantityFromQuote (quoteQuantity, price, precision) {
    return BigNumber(quoteQuantity).dividedBy(price).toFixed(precision, down)
  }

  #determineQuoteQuantityFromBase (baseQuantity, price, precision) {
    return BigNumber(baseQuantity).multipliedBy(price).toFixed(precision, up)
  }

  #validateAndSanitizeOrderOptions (options = {}) {
    const valid = validate(options, {
      exchange: { type: 'string' },
      market: { type: 'string', custom: (...args) => this.#validateMarket(...args) },
      side: { type: 'enum', values: Object.values(ExchangeOrder.sides) },
      type: { type: 'enum', values: Object.values(ExchangeOrder.types) },
      baseQuantity: { type: 'number', optional: true, convert: true, custom: (...args) => this.#validateBaseQuantity(...args) },
      quoteQuantity: { type: 'number', optional: true, convert: true, custom: (...args) => this.#validateQuoteQuantity(...args) }
    })

    if (valid !== true) {
      throw new ValidationError('ExchangeOrder validation error', null, valid)
    }
  }

  #validateAndSanitizeCancelOrderParams (params = {}) {
    const valid = validate(params, { id: { type: 'uuid', custom: (...args) => this.#validateOrderExists(...args) } })

    if (valid !== true) {
      throw new ValidationError('ExchangeOrder validation error', null, valid)
    }
  }

  #validateMarket (value, errors) {
    const market = this.getMarket(value)

    if (!market) {
      errors.push({ type: 'doesNotExist' })
    }

    return value
  }

  #validateBaseQuantity (value, errors, _schema, field, _, context) {
    if (!value) {
      return value
    }

    const market = this.getMarket(context.data.market)
    const quantity = BigNumber(value)

    if (market && !quantity.isEqualTo(0) && context.data.side === ExchangeOrder.sides.SELL) {
      const balance = this.getBalance(market.base)

      if (!balance) {
        errors.push({ message: 'no matching base balance', type: 'noMatchingBaseBalance' })
      } else if (quantity.isGreaterThan(balance.free)) {
        errors.push({ type: 'insufficientBalance' })
      }
    }

    return ExchangeOrder.convertToBigNumber(value)
  }

  #validateQuoteQuantity (value, errors, _schema, field, _, context) {
    if (!value) {
      return value
    }

    const market = this.getMarket(context.data.market)
    const quantity = BigNumber(value)

    if (market && !quantity.isEqualTo(0) && context.data.side === ExchangeOrder.sides.BUY) {
      const balance = this.getBalance(market.quote)

      if (!balance) {
        errors.push({ message: 'no matching quote balance', type: 'noMatchingQuoteBalance' })
      } else if (quantity.isGreaterThan(balance.free)) {
        errors.push({ type: 'insufficientBalance' })
      }
    }

    return ExchangeOrder.convertToBigNumber(value)
  }

  #validateQuantityAgainstMarketLimits (field, type, market, quantity) {
    if (BigNumber(quantity).isLessThan(market.limits[type].min)) {
      throw new ValidationError('ExchangeOrder validation error', null, [{
        field,
        type: 'minimumLimit',
        actual: quantity,
        message: `${field} is lower than exchange minimum ${type}`
      }])
    } else if (BigNumber(quantity).isGreaterThan(market.limits[type].max)) {
      throw new ValidationError('ExchangeOrder validation error', null, [{
        field,
        type: 'maximumLimit',
        actual: quantity,
        message: `${field} is greater than exchange maximum ${type}`
      }])
    }
  }

  #validateOrderExists (value, errors) {
    const order = this.orders.find(order => order.id === value)

    if (!order) {
      errors.push({ label: 'order', type: 'doesNotExist' })
    }

    return value
  }

  #verifyTickAndCandle () {
    if (this.#tick === undefined || this.#candle === undefined) {
      throw new SimulationExchangeError('tick and candle should be set with setTick() and setCandle()')
    }
  }
}

module.exports = Simulation
