const { expect, Factory, behaviours, chance, BigNumber, moment } = require('../../helpers')

const Exchange = require('../../../lib/exchanges/simulation')
const { ExchangeOrder, OrderOptions } = require('../../../lib/models')

describe('Exchanges: Simulation', () => {
  const defaultCandle = {
    timestamp: moment().utc().subtract(5, 'minutes').toDate(),
    open: chance.floating({ min: 30, max: 50 }),
    high: chance.floating({ min: 90, max: 100 }),
    low: chance.floating({ min: 10, max: 30 }),
    close: chance.floating({ min: 70, max: 90 })
  }
  const defaultTick = chance.floating({ min: defaultCandle.low, max: defaultCandle.high })

  describe('#cancelOrder', () => {
    const market = Factory('market').build({ symbol: 'BTC/USDT' })

    describe('params', () => {
      describe('id', () => {
        const exchange = new Exchange()

        before(() => {
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
        })

        behaviours.throwsValidationError('is required', {
          check: () => exchange.cancelOrder(),
          expect: error => expect(error.data[0].message).to.eql('id is required')
        })

        behaviours.throwsValidationError('must be a valid UUID', {
          check: () => exchange.cancelOrder({ id: chance.string() }),
          expect: error => expect(error.data[0].message).to.eql('id must be a valid UUID')
        })

        behaviours.throwsValidationError('order exist', {
          check: () => exchange.cancelOrder({ id: chance.guid() }),
          expect: error => expect(error.data[0].message).to.eql('order does not exist')
        })
      })

      describe('timestamp', () => {
        let exchange
        let order

        before(() => {
          const balances = [Factory('balance').build({ symbol: 'USDT', free: 1000, used: 200, total: 1000 })]

          order = Factory('exchangeOrder').build({
            type: OrderOptions.types.LIMIT,
            side: OrderOptions.sides.BUY,
            status: ExchangeOrder.statuses.OPEN,
            quoteQuantity: 100,
            price: chance.floating({ min: 1, max: 100 })
          })

          exchange = new Exchange({ markets: [market], balances, orders: [order] })
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
        })

        behaviours.throwsValidationError('must be a date', {
          check: () => exchange.cancelOrder({ id: order.id, timestamp: chance.string() }),
          expect: error => expect(error.data[0].message).to.eql('timestamp must be a Date')
        })
      })
    })

    describe('when no tick is set', () => {
      const exchange = new Exchange()

      behaviours.throwsSimulationExchangeError('throws an error', {
        check: () => exchange.cancelOrder({ id: chance.string() }),
        expect: error => expect(error.message).to.eql('tick and candle should be set with setTick() and setCandle()')
      })
    })

    describe('when no candle is set', () => {
      const exchange = new Exchange()

      behaviours.throwsSimulationExchangeError('throws an error', {
        check: () => exchange.cancelOrder({ id: chance.string() }),
        expect: error => expect(error.message).to.eql('tick and candle should be set with setTick() and setCandle()')
      })
    })

    describe('when order exists', () => {
      describe('and side is BUY', () => {
        it('unlocks quote asset', () => {
          const balances = [Factory('balance').build({ symbol: 'USDT', free: 1000, used: 200, total: 1000 })]
          const order = Factory('exchangeOrder').build({
            type: OrderOptions.types.LIMIT,
            side: OrderOptions.sides.BUY,
            quoteQuantity: 100,
            price: chance.floating({ min: 1, max: 100 })
          })
          const exchange = new Exchange({ markets: [market], balances, orders: [order] })
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
          exchange.cancelOrder({ id: order.id })

          expect(exchange.getBalance(market.quote).free).to.eql(BigNumber(1000).plus(100).toFixed())
          expect(exchange.getBalance(market.quote).used).to.eql(BigNumber(100).toFixed())
        })
      })

      describe('and side is SELL', () => {
        it('unlocks base asset', () => {
          const balances = [Factory('balance').build({ symbol: 'BTC', free: 100, used: 100, total: 1000 })]
          const order = Factory('exchangeOrder').build({
            type: OrderOptions.types.LIMIT,
            side: OrderOptions.sides.SELL,
            baseQuantity: 50,
            price: chance.floating({ min: 1, max: 100 })
          })

          const exchange = new Exchange({ markets: [market], balances, orders: [order] })
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
          exchange.cancelOrder({ id: order.id })

          expect(exchange.getBalance(market.base).free).to.eql(BigNumber(150).toFixed())
          expect(exchange.getBalance(market.base).used).to.eql(BigNumber(50).toFixed())
        })
      })

      describe('status', () => {
        it('is set to cancelled', () => {
          const balances = [Factory('balance').build({ symbol: 'USDT', free: 1000, total: 1000 })]
          const order = Factory('exchangeOrder').build({
            type: OrderOptions.types.LIMIT,
            side: OrderOptions.sides.BUY,
            quoteQuantity: 100,
            price: chance.floating({ min: 1, max: 100 })
          })
          const exchange = new Exchange({ markets: [market], balances, orders: [order] })
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
          exchange.cancelOrder({ id: order.id })

          expect(order.status).to.eql(ExchangeOrder.statuses.CANCELLED)
        })
      })

      describe('closedAt', () => {
        describe('when order params contains timestamp', () => {
          it('uses timestamp for closedAt', () => {
            const timestamp = moment().utc().add('1', 'minute').toDate()
            const balances = [Factory('balance').build({ symbol: 'USDT', free: 1000, total: 1000 })]
            const order = Factory('exchangeOrder').build({
              type: OrderOptions.types.LIMIT,
              side: OrderOptions.sides.BUY,
              quoteQuantity: 100,
              price: chance.floating({ min: 1, max: 100 })
            })
            const exchange = new Exchange({ markets: [market], balances, orders: [order] })
            exchange.setTick(defaultTick)
            exchange.setCandle(defaultCandle)
            exchange.cancelOrder({ id: order.id, timestamp })

            expect(order.closedAt).to.eql(timestamp)
          })
        })

        describe('when order params does not contain timestamp', () => {
          it('is set to current candle timestamp', () => {
            const balances = [Factory('balance').build({ symbol: 'USDT', free: 1000, total: 1000 })]
            const order = Factory('exchangeOrder').build({
              type: OrderOptions.types.LIMIT,
              side: OrderOptions.sides.BUY,
              quoteQuantity: 100,
              price: chance.floating({ min: 1, max: 100 })
            })
            const exchange = new Exchange({ markets: [market], balances, orders: [order] })
            exchange.setTick(defaultTick)
            exchange.setCandle(defaultCandle)
            exchange.cancelOrder({ id: order.id })

            expect(order.closedAt).to.eql(defaultCandle.timestamp)
          })
        })
      })
    })
  })
})
