const { expect, Factory, chance, BigNumber, moment } = require('../../../helpers')

const Exchange = require('../../../../lib/exchanges/simulation')
const { Balance, OrderOptions } = require('../../../../lib/models')

describe('Exchanges: Simulation', () => {
  describe('#evaluate when type is STOP_LOSS', () => {
    const defaultTick = 10
    const defaultCandle = {
      timestamp: moment().utc().subtract(5, 'minutes').toDate(),
      open: 9,
      high: 12,
      low: 8,
      close: 11
    }
    const market = Factory('market').build({ symbol: 'BTC/USDT' })
    let exchange

    describe('when stop price has not been hit', () => {
      beforeEach(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 1000, used: 0, total: 1000 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]

        exchange = new Exchange({ markets: [market], balances })

        exchange.setTick(defaultTick)
        exchange.setCandle(defaultCandle)
      })

      describe('and stop price is within high and low of current candle', () => {
        it('sets stop price hit to true', () => {
          const order = exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: OrderOptions.sides.SELL,
            type: OrderOptions.types.STOP_LOSS,
            stopPrice: chance.floating({ min: defaultCandle.low, max: defaultCandle.high }),
            baseQuantity: chance.floating({ min: 10, max: 100 })
          })

          expect(order.stopPriceHit).to.eql(undefined)

          exchange.evaluate()

          expect(order.stopPriceHit).to.eql(true)
        })
      })
    })

    describe('when stop price has been hit', () => {
      describe('order', () => {
        beforeEach(() => {
          const balances = [
            new Balance({ symbol: market.base, free: 1000, used: 0, total: 1000 }),
            new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
          ]

          exchange = new Exchange({ markets: [market], balances })

          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
        })

        it('emulates MARKET order with slippage', () => {
          const order = exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: OrderOptions.sides.SELL,
            type: OrderOptions.types.STOP_LOSS,
            stopPrice: chance.floating({ min: defaultCandle.low, max: defaultCandle.high }),
            baseQuantity: chance.floating({ min: 10, max: 100 })
          })

          const nextTick = 10.09

          exchange.setTick(nextTick)
          exchange.evaluate()

          const trade = order.trades[0]
          const high = BigNumber(nextTick).multipliedBy(1.001).toFixed(2, BigNumber.ROUND_DOWN)
          const low = BigNumber(nextTick).multipliedBy(0.999).toFixed(2, BigNumber.ROUND_DOWN)

          expect(order.status).to.eql('FILLED')
          expect(order.stopPriceHit).to.eql(true)
          expect(order.averagePrice).to.eql(trade.price)
          expect(order.trades.length).to.eql(1)
          expect(order.closedAt).to.eql(defaultCandle.timestamp)

          expect(Number(trade.price)).to.be.least(Number(low))
          expect(Number(trade.price)).to.be.most(Number(high))
        })
      })

      describe('locked balance', () => {
        beforeEach(() => {
          const balances = [
            new Balance({ symbol: market.base, free: 500, used: 500, total: 1000 }),
            new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
          ]

          exchange = new Exchange({ markets: [market], balances })

          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
        })

        it('releases base asset', () => {
          const baseQuantity = chance.floating({ min: 10, max: 100 })

          exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: OrderOptions.sides.SELL,
            type: OrderOptions.types.STOP_LOSS,
            stopPrice: chance.floating({ min: defaultCandle.low, max: defaultCandle.high }),
            baseQuantity
          })

          const balance = exchange.getBalance(market.base)

          expect(balance.used).to.eql(BigNumber(500).plus(baseQuantity).toFixed())

          // First, let's mark stop price as hit
          exchange.evaluate()

          // Then, let's evaluate the market order
          exchange.evaluate()

          expect(balance.used).to.eql('500')
        })
      })
    })
  })
})
