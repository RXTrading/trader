const { expect, Factory, chance, BigNumber } = require('../../helpers')

const Exchange = require('../../../lib/exchanges/simulation')
const { ExchangeOrder } = require('../../../lib/models')

describe('Exchanges: Simulation', () => {
  describe('#cancelOrder', () => {
    const market = Factory('market').build({ symbol: 'BTC/USDT' })

    describe('params', () => {
      const exchange = new Exchange()

      describe('id', () => {
        it('is required', () => {
          let thrownErr = null

          try {
            exchange.cancelOrder()
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('id is required')
        })

        it('must be a UUID', () => {
          let thrownErr = null

          try {
            exchange.cancelOrder({ id: chance.string() })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('id must be a valid UUID')
        })

        it('must exist', () => {
          let thrownErr = null

          try {
            exchange.cancelOrder({ id: chance.guid() })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('order does not exist')
        })
      })
    })

    describe('when order exists', () => {
      describe('and side is BUY', () => {
        it('unlocks quote asset', () => {
          const balances = [Factory('balance').build({ symbol: 'USDT', free: 1000, used: 200, total: 1000 })]
          const order = Factory('exchangeOrder').build({
            type: ExchangeOrder.types.LIMIT,
            side: ExchangeOrder.sides.BUY,
            quoteQuantity: 100,
            price: chance.floating({ min: 1, max: 100 })
          })
          const exchange = new Exchange({ markets: [market], balances, orders: [order] })

          exchange.cancelOrder({ id: order.id })

          expect(exchange.getBalance(market.quote).free).to.eql(BigNumber(1000).plus(100).toFixed())
          expect(exchange.getBalance(market.quote).used).to.eql(BigNumber(100).toFixed())
        })
      })

      describe('and side is SELL', () => {
        it('unlocks base asset', () => {
          const balances = [Factory('balance').build({ symbol: 'BTC', free: 100, used: 100, total: 1000 })]
          const order = Factory('exchangeOrder').build({
            type: ExchangeOrder.types.LIMIT,
            side: ExchangeOrder.sides.SELL,
            baseQuantity: 50,
            price: chance.floating({ min: 1, max: 100 })
          })

          const exchange = new Exchange({ markets: [market], balances, orders: [order] })

          exchange.cancelOrder({ id: order.id })

          expect(exchange.getBalance(market.base).free).to.eql(BigNumber(150).toFixed())
          expect(exchange.getBalance(market.base).used).to.eql(BigNumber(50).toFixed())
        })
      })

      describe('status', () => {
        it('is set to cancelled', () => {
          const balances = [Factory('balance').build({ symbol: 'USDT', free: 1000, total: 1000 })]
          const order = Factory('exchangeOrder').build({
            type: ExchangeOrder.types.LIMIT,
            side: ExchangeOrder.sides.BUY,
            quoteQuantity: 100,
            price: chance.floating({ min: 1, max: 100 })
          })
          const exchange = new Exchange({ markets: [market], balances, orders: [order] })

          exchange.cancelOrder({ id: order.id })

          expect(order.status).to.eql(ExchangeOrder.statuses.CANCELLED)
        })
      })
    })
  })
})
