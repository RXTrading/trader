const { expect, Factory, chance, BigNumber } = require('../../../helpers')

const Exchange = require('../../../../lib/exchanges/simulation')
const { Balance, ExchangeOrder } = require('../../../../lib/models')

describe('Exchanges: Simulation', () => {
  describe('#evaluate when type is TAKE_PROFIT_LIMIT', () => {
    const defaultTick = 10
    const defaultCandle = { open: 9, high: 12, low: 8, close: 11 }
    const market = Factory('market').build({ symbol: 'BTC/USDT' })
    const stopPrice = chance.floating({ min: defaultCandle.low, max: defaultCandle.high })
    const price = 15

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
        let order

        beforeEach(() => {
          order = exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: ExchangeOrder.sides.SELL,
            type: ExchangeOrder.types.TAKE_PROFIT_LIMIT,
            stopPrice,
            price,
            baseQuantity: chance.floating({ min: 10, max: 100 })
          })
        })

        it('sets stop price hit to true', () => {
          expect(order.stopPriceHit).to.eql(undefined)
          exchange.evaluate()
          expect(order.stopPriceHit).to.eql(true)
        })

        it('does not execute the LIMIT order', () => {
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
      describe('and order price is within high and low of current candle', () => {
        before(() => {
          const balances = [
            new Balance({ symbol: market.base, free: 1000, used: 0, total: 1000 }),
            new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
          ]

          exchange = new Exchange({ markets: [market], balances })
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
        })

        describe('order', () => {
          it('emulates LIMIT order as FILLED at price', () => {
            const order = exchange.createOrder({
              exchange: 'binance',
              market: market.symbol,
              side: ExchangeOrder.sides.SELL,
              type: ExchangeOrder.types.TAKE_PROFIT_LIMIT,
              stopPrice,
              price,
              baseQuantity: chance.floating({ min: 10, max: 100 })
            })

            // First, let's mark stop price as hit
            exchange.evaluate()

            // Now we can evaluate the LIMIT order
            exchange.setCandle({ open: 15, high: 22, low: 13, close: 21 })
            exchange.evaluate()

            expect(order.status).to.eql('FILLED')
            expect(order.price).to.eql(order.trades[0].price)
            expect(order.trades.length).to.eql(1)
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
              type: ExchangeOrder.types.TAKE_PROFIT_LIMIT,
              stopPrice,
              price,
              baseQuantity
            })

            const balance = exchange.getBalance(market.base)

            expect(balance.used).to.eql(BigNumber(500).plus(baseQuantity).toFixed())

            // First, let's mark stop price as hit
            exchange.evaluate()

            // Now we can evaluate the LIMIT order
            exchange.setCandle({ open: 15, high: 22, low: 13, close: 21 })
            exchange.evaluate()

            expect(balance.used).to.eql('500')
          })
        })
      })

      describe('when order price is outside high and low of current candle', () => {
        beforeEach(() => {
          const balances = [
            new Balance({ symbol: market.base, free: 500, used: 500, total: 1000 }),
            new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
          ]

          exchange = new Exchange({ markets: [market], balances })

          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
        })

        it('does not change the order', () => {
          const order = exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: ExchangeOrder.sides.SELL,
            type: ExchangeOrder.types.TAKE_PROFIT_LIMIT,
            stopPrice,
            price,
            baseQuantity: chance.floating({ min: 10, max: 100 })
          })

          exchange.evaluate()
          exchange.evaluate()

          expect(order.status).to.eql('OPEN')
          expect(order.baseQuantityGross).to.eql('0')
          expect(order.baseQuantityNet).to.eql('0')
          expect(order.quoteQuantityGross).to.eql('0')
          expect(order.quoteQuantityNet).to.eql('0')
        })
      })
    })
  })
})
