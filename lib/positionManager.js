const _ = require('lodash')
const BigNumber = require('bignumber.js')
const jsonata = require('jsonata')

const { ValidationError } = require('./errors')
const { validate } = require('./validator')
const { Position, Order } = require('./models')

const down = BigNumber.ROUND_DOWN
const up = BigNumber.ROUND_UP

class PositionManagerValidationError extends ValidationError {
  constructor (data) {
    super('Position manager validation error', 'POSITION_MANAGER_VALIDATION_ERROR', data)
  }
}

class PositionManager {
  #trader
  #positions = []

  constructor (opts = {}) {
    this.#validateAndSanitizeOpts(opts)

    this.#trader = opts.trader
    this.#positions = opts.positions || []

    this.#trader.on('position.open', params => this.open(params))
    this.#trader.on('position.close', params => this.close(params))
    this.#trader.on('position.closeAll', async params => this.closeAll(params))
  }

  get all () {
    return this.#positions
  }

  async open (params = {}) {
    const exchange = params.entry?.exchange
    const market = params.entry?.market

    const position = new Position({
      timestamp: params.timestamp,
      signalId: params.signalId,
      status: Position.statuses.OPEN,
      type: params.type,
      exchange,
      market,
      entry: params.entry,
      exit: params.exit
    })

    const exchangeOrder = this.#trader.exchange.createOrder({
      timestamp: params.timestamp,
      side: Order.sides.BUY,
      ...params.entry
    })

    const order = Order.fromExchangeOrder(exchangeOrder)

    position.set({ orders: [order] })

    this.all.push(position)

    await this.#trader.emitAsync('position.opened', position)
  }

  // First, we have to cancel any orders that are still OPEN.
  // Then we can create a sell order for any remaining sellable quantity of the position.
  async close (params = {}) {
    this.#validateAndSanitizeCloseParams(params)

    const position = this.all.find(position => position.id === params.id)
    const openOrders = position.orders.filter(order => order.status === Order.statuses.OPEN)

    position.set({ status: Position.statuses.CLOSING })

    openOrders.forEach(order => {
      this.#trader.exchange.cancelOrder({ id: order.foreignId })
      this.#evaluateOrder(order)
    })

    const offsetQuantity = position.orders.reduce((total, order) => {
      return order.side === Order.sides.BUY ? total.plus(order.baseQuantityNet) : total.minus(order.baseQuantityNet)
    }, BigNumber(0.00))

    if (!offsetQuantity.isEqualTo(0)) {
      try {
        const exchangeOrder = this.#trader.exchange.createOrder({
          ..._.pick(position, ['exchange', 'market']),
          timestamp: params.timestamp,
          side: Order.sides.SELL,
          type: Order.types.MARKET,
          baseQuantity: offsetQuantity.toFixed()
        })

        const offsetOrder = Order.fromExchangeOrder(exchangeOrder)
        position.set({ orders: [...position.orders, offsetOrder] })

        await this.#trader.emitAsync('position.updated', position)
      } catch (err) {
        let quantityError = false

        if (_.isArray(err.data)) {
          quantityError = err.data?.find(e => {
            if (e.field === 'baseQuantity' && (['minimumLimit', 'maximumLimit'].includes(e.type))) {
              return true
            } else if (e.field === 'quoteQuantity' && (['minimumLimit', 'maximumLimit'].includes(e.type))) {
              return true
            }

            return false
          })
        }

        if (!quantityError) {
          throw err
        }
      }
    }
  }

  async closeAll (params = {}) {
    const positions = this.all.filter(position => position.status === Position.statuses.OPEN)
    const closePromises = []

    for (let i = 0; i < positions.length; i++) {
      closePromises.push(this.close({ id: positions[i].id, ..._.pick(params, ['timestamp']) }))
    }

    return Promise.all(closePromises)
  }

  async evaluate (options = {}) {
    const positions = this.all.filter(position => position.status !== Position.statuses.CLOSED)

    for (let i = 0; i < positions.length; i++) {
      await this.#evaluatePosition(positions[i], options)
      await this.#trader.emitAsync('position.updated', positions[i])
    }
  }

  async #evaluatePosition (position, options = {}) {
    const entry = position.orders.find(order => order.side === Order.sides.BUY)

    position.orders.forEach(order => this.#evaluateOrder(order))

    if (position.exit.length > 0 && entry.status === Order.statuses.FILLED) {
      await this.#evaluateExitOrders(position, options)
    }

    if (this.#shouldPositionBeClosed(position)) {
      position.set({ status: 'CLOSED', closedAt: options.timestamp })
    }

    const pnlMetrics = this.#getPnlMetricsForPosition(position)
    position.set(pnlMetrics)
  }

  #evaluateOrder (order) {
    const exchangeOrder = this.#trader.exchange.getOrder(order.foreignId)

    order.set({
      ..._.pick(exchangeOrder, [
        'status',
        'side',
        'price',
        'baseQuantityGross',
        'baseQuantityNet',
        'quoteQuantityGross',
        'quoteQuantityNet',
        'averagePrice',
        'trades'
      ])
    })
  }

  async #evaluateExitOrders (position, options = {}) {
    const exitOrderIds = position.exit.map(order => order.id)
    const exitOrders = position.orders.filter(order => exitOrderIds.includes(order.exitId))

    if (position.exit.length > 0 && exitOrders.length === 0) {
      await this.#createPositionExitOrders(position, options)
    }
  }

  async #createPositionExitOrders (position, options = {}) {
    const entry = position.orders.find(order => order.side === Order.sides.BUY)

    let totalExitQuantity = BigNumber(0.00)

    for (let i = 0; i < position.exit.length; i++) {
      const config = position.exit[i]
      const exit = await this.#parseExitOrder(config, { entry })

      if (i === (position.exit.length - 1)) {
        const market = this.#trader.exchange.getMarket(exit.market)
        const basePrecision = market.precision.amount

        exit.baseQuantity = BigNumber(entry.baseQuantityNet).minus(totalExitQuantity).toFixed(basePrecision, down)
      } else {
        totalExitQuantity = totalExitQuantity.plus(exit.baseQuantity)
      }

      const exchangeOrder = this.#trader.exchange.createOrder({ timestamp: options.timestamp, ...exit })
      const order = Order.fromExchangeOrder(exchangeOrder, { exitId: exit.id })

      position.set({ orders: [...position.orders, order] })
    }
  }

  async #parseExitOrder (order, obj) {
    const parsedOrder = _.cloneDeep(order)
    const market = this.#trader.exchange.getMarket(order.market)
    const basePrecision = market.precision.amount
    const quotePrecision = market.precision.price

    for (let i = 0; i < Object.keys(order).length; i++) {
      const key = Object.keys(order)[i]

      try {
        const parsed = await jsonata(parsedOrder[key]).evaluate(obj)

        if (parsed) {
          parsedOrder[key] = parsed
        }
      } catch (err) {
        // Do nothing
      }
    }

    if (parsedOrder.price) {
      parsedOrder.price = BigNumber(parsedOrder.price).toFixed(quotePrecision, down)
    }

    if (parsedOrder.stopPrice) {
      parsedOrder.stopPrice = BigNumber(parsedOrder.stopPrice).toFixed(quotePrecision, down)
    }

    if (parsedOrder.baseQuantity) {
      parsedOrder.baseQuantity = BigNumber(parsedOrder.baseQuantity).toFixed(basePrecision, down)
    }

    if (parsedOrder.quoteQuantity) {
      parsedOrder.quoteQuantity = BigNumber(parsedOrder.quoteQuantity).toFixed(basePrecision, up)
    }

    return parsedOrder
  }

  #shouldPositionBeClosed (position) {
    const market = this.#trader.exchange.getMarket(position.market)
    const basePrecision = market.precision.amount

    const entryOrders = position.findFilledEntryOrders(position)
    const offsetOrders = position.findFilledExitOrders(position)

    const entryQuantityNet = entryOrders.reduce((total, order) => {
      return total.plus(order.baseQuantityNet)
    }, BigNumber(0.00))

    const offsetQuantityNet = offsetOrders.reduce((total, order) => {
      return total.plus(order.baseQuantityNet)
    }, BigNumber(0.00))

    const entryQuantity = entryQuantityNet.toFixed(basePrecision, BigNumber.ROUND_DOWN)
    const offsetQuantity = offsetQuantityNet.toFixed(basePrecision, BigNumber.ROUND_DOWN)

    return offsetQuantity === entryQuantity
  }

  #getPnlMetricsForPosition (position) {
    const market = this.#trader.exchange.getMarket(position.market)
    const precision = market.precision.price
    const zero = BigNumber(0.00)

    // Use NET, as the fees were taken from base when BUY
    const buyBaseQuantity = position.orders.filter(
      order => order.side === 'BUY'
    ).reduce((total, order) => total.plus(order.baseQuantityNet), BigNumber(0.00))

    // Use GROSS as the fees were taken from base when BUY
    const buyQuoteQuantity = position.orders.filter(
      order => order.side === 'BUY'
    ).reduce((total, order) => total.plus(order.quoteQuantityGross), BigNumber(0.00))

    // Use NET, as the fees were taken from quote when SELL
    const sellBaseQuantity = position.orders.filter(
      order => order.side === 'SELL'
    ).reduce((total, order) => total.plus(order.baseQuantityNet), BigNumber(0.00))

    // Use NET, as the fees taken away from quote when SELL
    const sellQuoteQuantity = position.orders.filter(
      order => order.side === 'SELL'
    ).reduce((total, order) => total.plus(order.quoteQuantityNet), BigNumber(0.00))

    const currentPrice = this.#trader.exchange.getTick()
    const offsetBase = BigNumber(buyBaseQuantity.minus(sellBaseQuantity))
    const offsetQuote = BigNumber(offsetBase.toFixed(precision, BigNumber.ROUND_DOWN)).multipliedBy(currentPrice)

    const realizedPnL = sellBaseQuantity.toFixed() === zero.toFixed() ? zero : sellQuoteQuantity.minus(buyQuoteQuantity)
    const realizedPnLPercent = realizedPnL.toFixed() === zero.toFixed() ? zero : realizedPnL.dividedBy(buyQuoteQuantity).multipliedBy(100)

    let unrealizedPnL = BigNumber('0.00')
    let unrealizedPnLPercent = BigNumber('0.00')

    // Offset base quantity needs to be rounded down to possible order limit precision
    // If remainder of unsold is not dust (less than minimum order limit), we have unrealized PnL
    if (offsetBase.toFixed(precision, BigNumber.ROUND_DOWN) !== zero.toFixed(precision, BigNumber.ROUND_DOWN)) {
      unrealizedPnL = offsetBase.toFixed() === zero.toFixed() ? zero : offsetQuote.plus(sellQuoteQuantity).minus(buyQuoteQuantity)
      unrealizedPnLPercent = unrealizedPnL.toFixed() === zero.toFixed() ? zero : unrealizedPnL.dividedBy(buyQuoteQuantity).multipliedBy(100)
    }

    const pnl = realizedPnL.plus(unrealizedPnL)
    const pnlPercent = pnl.toFixed() === zero.toFixed() ? zero : pnl.dividedBy(buyQuoteQuantity).multipliedBy(100)
    const win = position.status === 'CLOSED' ? pnl > 0.00 : null

    return {
      realizedPnL: realizedPnL.toFixed(precision, BigNumber.ROUND_DOWN),
      realizedPnLPercent: realizedPnLPercent.toFixed(precision, BigNumber.ROUND_DOWN),
      unrealizedPnL: unrealizedPnL.toFixed(precision, BigNumber.ROUND_DOWN),
      unrealizedPnLPercent: unrealizedPnLPercent.toFixed(precision, BigNumber.ROUND_DOWN),
      pnl: pnl.toFixed(precision, BigNumber.ROUND_DOWN),
      pnlPercent: pnlPercent.toFixed(precision, BigNumber.ROUND_DOWN),
      win
    }
  }

  #validateAndSanitizeOpts (opts) {
    const sanitizedOpts = _.cloneDeep(opts)

    const valid = validate(sanitizedOpts, {
      trader: { type: 'object', props: { on: { type: 'function' } } },
      positions: { type: 'array', items: { type: 'class', instanceOf: Position }, optional: true, default: [] }
    })

    if (valid !== true) {
      throw new PositionManagerValidationError(valid)
    }
  }

  #validateAndSanitizeCloseParams (params) {
    const valid = validate(params, {
      id: { type: 'uuid', custom: (...args) => this.#validatePositionExists(...args) },
      timestamp: { type: 'date', optional: true, convert: true }
    })

    if (valid !== true) {
      throw new PositionManagerValidationError(valid)
    }
  }

  #validatePositionExists (value, errors) {
    const position = this.all.find(position => position.id === value)

    if (!position) {
      errors.push({ label: 'position', type: 'doesNotExist' })
    }

    return value
  }
}

module.exports = PositionManager
