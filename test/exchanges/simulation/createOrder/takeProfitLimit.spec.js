const { expect, Factory, behaviours, chance, BigNumber } = require('../../../helpers')

const Exchange = require('../../../../lib/exchanges/simulation')
const { ExchangeOrder, OrderOptions, Market, Balance } = require('../../../../lib/models')

describe('Exchanges: Simulation', () => {
  describe('#createOrder when type is TAKE_PROFIT_LIMIT', () => {
    const candle = {
      open: chance.floating({ min: 30, max: 50 }),
      high: chance.floating({ min: 90, max: 100 }),
      low: chance.floating({ min: 10, max: 30 }),
      close: chance.floating({ min: 70, max: 90 })
    }

    const tick = chance.floating({ min: candle.low, max: candle.high })

    describe('and base and quote quantity are within Market limits', () => {
      const market = Factory('market').build({ symbol: 'BTC/USDT' })
      const orderOptions = {
        exchange: 'binance',
        market: market.symbol,
        side: OrderOptions.sides.SELL,
        type: OrderOptions.types.TAKE_PROFIT_LIMIT,
        stopPrice: BigNumber(candle.high).multipliedBy(1.5).toFixed(),
        price: BigNumber(candle.high).multipliedBy(1.51).toFixed(),
        baseQuantity: chance.floating({ min: 10, max: 100 })
      }

      let exchange

      beforeEach(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 1000, used: 0, total: 1000 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]
        exchange = new Exchange({ markets: [market], balances })
      })

      it('sets status to OPEN', () => {
        exchange.setTick(tick)
        exchange.setCandle(candle)
        exchange.createOrder({ ...orderOptions })

        const order = exchange.getOrders()[0]

        expect(order.status).to.eql(ExchangeOrder.statuses.OPEN)
      })

      it('locks base asset', () => {
        exchange.setTick(tick)
        exchange.setCandle(candle)

        expect(exchange.getBalance(market.base)).to.deep.include({ free: '1000', used: '0' })

        exchange.createOrder({ ...orderOptions, side: OrderOptions.sides.SELL })

        const expectedUsed = BigNumber(orderOptions.baseQuantity).toFixed()

        expect(exchange.getBalance(market.base).free).to.eql(BigNumber(1000).minus(expectedUsed).toFixed())
        expect(exchange.getBalance(market.base).used).to.eql(expectedUsed)
      })
    })

    describe('and base quantity is for less than Market minimum amount', () => {
      const market = Factory('market').build({ limits: { amount: { min: 0.01 } } })

      let exchange

      before(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 10, used: 0, total: 10 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]
        exchange = new Exchange({ markets: [market], balances })

        exchange.setTick(1)
        exchange.setCandle({ open: 0.9, high: 1.2, low: 0.8, close: 1.1 })
      })

      behaviours.throwsValidationError('throws an error', {
        check: () => {
          exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: OrderOptions.sides.SELL,
            type: OrderOptions.types.TAKE_PROFIT_LIMIT,
            stopPrice: 0.9,
            price: 0.10,
            baseQuantity: 0.001
          })
        },
        expect: error => expect(error.data[0].message).to.eql('baseQuantity is lower than exchange minimum amount')
      })
    })

    describe('and base quantity is for more than Market maximum amount', () => {
      const market = Factory('market').build({ limits: { amount: { max: 10.00 } } })

      let exchange

      before(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 100, used: 0, total: 100 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]
        exchange = new Exchange({ markets: [market], balances })

        exchange.setTick(1)
        exchange.setCandle({ open: 0.9, high: 1.2, low: 0.8, close: 1.1 })
      })

      behaviours.throwsValidationError('throws an error', {
        check: () => {
          exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: OrderOptions.sides.SELL,
            type: OrderOptions.types.TAKE_PROFIT_LIMIT,
            stopPrice: 0.9,
            price: 0.10,
            baseQuantity: 50
          })
        },
        expect: error => expect(error.data[0].message).to.eql('baseQuantity is greater than exchange maximum amount')
      })
    })

    describe('and quote quantity is for less than Market minimum cost', () => {
      const market = Factory('market').build({ limits: { cost: { min: 10.00 } } })

      let exchange

      before(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 10, used: 0, total: 10 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]
        exchange = new Exchange({ markets: [market], balances })

        exchange.setTick(1)
        exchange.setCandle({ open: 0.9, high: 1.2, low: 0.8, close: 1.1 })
      })

      behaviours.throwsValidationError('throws an error', {
        check: () => {
          exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: OrderOptions.sides.SELL,
            type: OrderOptions.types.TAKE_PROFIT_LIMIT,
            stopPrice: 0.9,
            price: 0.10,
            baseQuantity: 1
          })
        },
        expect: error => expect(error.data[0].message).to.eql('quoteQuantity is lower than exchange minimum cost')
      })
    })

    describe('and quote quantity is for more than Market maximum cost', () => {
      const market = new Market({
        symbol: 'BTC/USDT',
        base: 'BTC',
        quote: 'USDT',
        limits: { cost: { max: 20.00 } }
      })

      let exchange

      before(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 10, used: 0, total: 10 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]
        exchange = new Exchange({ markets: [market], balances })

        exchange.setTick(100)
        exchange.setCandle({ open: 90, high: 120, low: 80, close: 110 })
      })

      behaviours.throwsValidationError('throws an error', {
        check: () => {
          exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: OrderOptions.sides.SELL,
            type: OrderOptions.types.TAKE_PROFIT_LIMIT,
            stopPrice: 90,
            price: 100,
            baseQuantity: 1
          })
        },
        expect: error => expect(error.data[0].message).to.eql('quoteQuantity is greater than exchange maximum cost')
      })
    })
  })
})
