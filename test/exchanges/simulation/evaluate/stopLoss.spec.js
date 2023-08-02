const { expect, Factory, chance, BigNumber } = require('../../../helpers')

const Exchange = require('../../../../lib/exchanges/simulation')
const { Balance, ExchangeOrder } = require('../../../../lib/models')

describe('Exchanges: Simulation', () => {
  describe('#evaluate when type is STOP_LOSS', () => {
    const defaultTick = 10
    const defaultCandle = { open: 9, high: 12, low: 8, close: 11 }
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
            side: ExchangeOrder.sides.SELL,
            type: ExchangeOrder.types.STOP_LOSS,
            stopPrice: chance.floating({ min: defaultCandle.low, max: defaultCandle.high }),
            baseQuantity: chance.floating({ min: 10, max: 100 })
          })

          expect(order.stopPriceHit).to.eql(undefined)

          exchange.evaluate()

          expect(order.stopPriceHit).to.eql(true)
        })

        it('does not execute the MARKET order', () => {
          const order = exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: ExchangeOrder.sides.SELL,
            type: ExchangeOrder.types.STOP_LOSS,
            stopPrice: chance.floating({ min: defaultCandle.low, max: defaultCandle.high }),
            baseQuantity: chance.floating({ min: 10, max: 100 })
          })

          exchange.evaluate()

          expect(order.status).to.eql('OPEN')
          expect(order.baseQuantityGross).to.eql('0')
          expect(order.baseQuantityNet).to.eql('0')
          expect(order.quoteQuantityGross).to.eql('0')
          expect(order.quoteQuantityNet).to.eql('0')
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
          const nextTick = 10.09

          exchange.setCandle(defaultCandle)

          const order = exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: ExchangeOrder.sides.SELL,
            type: ExchangeOrder.types.STOP_LOSS,
            stopPrice: chance.floating({ min: defaultCandle.low, max: defaultCandle.high }),
            baseQuantity: chance.floating({ min: 10, max: 100 })
          })

          // First, let's mark stop price as hit
          exchange.evaluate()

          expect(order.stopPriceHit).to.eql(true)
          expect(order.averagePrice).to.eql('0')

          // Now we can evaluate the market order
          exchange.setTick(nextTick)
          exchange.evaluate()

          const trade = order.trades[0]
          const high = BigNumber(nextTick).multipliedBy(1.001).toFixed(2, BigNumber.ROUND_DOWN)
          const low = BigNumber(nextTick).multipliedBy(0.999).toFixed(2, BigNumber.ROUND_DOWN)

          expect(order.status).to.eql('FILLED')
          expect(order.averagePrice).to.eql(trade.price)
          expect(order.trades.length).to.eql(1)

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
            side: ExchangeOrder.sides.SELL,
            type: ExchangeOrder.types.STOP_LOSS,
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
