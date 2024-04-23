const { expect, Factory, chance, BigNumber, moment } = require('../../../helpers')

const Exchange = require('../../../../lib/exchanges/simulation')
const { Balance, OrderOptions } = require('../../../../lib/models')

describe('Exchanges: Simulation', () => {
  const market = Factory('market').build({ symbol: 'BTC/USDT' })

  describe('#evaluate when type is LIMIT', () => {
    const defaultCandle = {
      timestamp: moment().utc().subtract(5, 'minutes').toDate(),
      open: chance.floating({ min: 30, max: 50 }),
      high: chance.floating({ min: 90, max: 100 }),
      low: chance.floating({ min: 10, max: 30 }),
      close: chance.floating({ min: 70, max: 90 })
    }
    const defaultTick = chance.floating({ min: defaultCandle.low, max: defaultCandle.high })

    describe('when order price is within high and low of current candle', () => {
      describe('order', () => {
        let exchange

        before(() => {
          const balances = [
            new Balance({ symbol: market.base, free: 1000, used: 0, total: 1000 }),
            new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
          ]

          exchange = new Exchange({ markets: [market], balances })
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
        })

        it('emulates LIMIT order as FILLED at price', () => {
          const order = exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: OrderOptions.sides.BUY,
            type: OrderOptions.types.LIMIT,
            price: chance.floating({ min: defaultCandle.low, max: defaultCandle.high }),
            quoteQuantity: chance.floating({ min: 10, max: 100 })
          })

          exchange.evaluate()

          const trade = order.trades[0]

          expect(order.status).to.eql('FILLED')
          expect(order.price).to.eql(trade.price)
          expect(order.trades.length).to.eql(1)
          expect(order.closedAt).to.eql(defaultCandle.timestamp)
        })
      })

      describe('when side is BUY', () => {
        let exchange

        before(() => {
          const balances = [
            new Balance({ symbol: market.base, free: 1000, used: 0, total: 1000 }),
            new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
          ]

          exchange = new Exchange({ markets: [market], balances })
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
        })

        it('releases quote asset', () => {
          const price = 75
          const quoteQuantity = 10000 // chance.floating({ min: 10, max: 100 })

          exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: OrderOptions.sides.BUY,
            type: OrderOptions.types.LIMIT,
            price,
            quoteQuantity
          })

          expect(exchange.getBalance(market.quote).used).to.eql(BigNumber(quoteQuantity).toFixed())

          exchange.evaluate()

          expect(exchange.getBalance(market.quote).used).to.eql('0')
        })
      })

      describe('when side is SELL', () => {
        let exchange

        beforeEach(() => {
          const balances = [
            new Balance({ symbol: market.base, free: 1000, used: 0, total: 1000 }),
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
            type: OrderOptions.types.LIMIT,
            price: chance.floating({ min: defaultCandle.low, max: defaultCandle.high }),
            baseQuantity
          })

          const usedBefore = BigNumber(baseQuantity).toFixed()

          expect(exchange.getBalance(market.base).used).to.eql(usedBefore)

          exchange.evaluate()

          expect(exchange.getBalance(market.base).used).to.eql('0')
        })
      })
    })

    describe('when order price is outside high and low of current candle', () => {
      let exchange

      beforeEach(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 1, used: 0, total: 1 }),
          new Balance({ symbol: market.quote, free: 1000, used: 0, total: 1000 })
        ]

        exchange = new Exchange({ markets: [market], balances })

        exchange.setTick(defaultTick)
        exchange.setCandle(defaultCandle)
      })

      it('does not change the order', () => {
        const order = exchange.createOrder({
          exchange: 'binance',
          market: market.symbol,
          side: OrderOptions.sides.SELL,
          type: OrderOptions.types.LIMIT,
          price: 10000,
          baseQuantity: 1
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
})
