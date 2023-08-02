const { expect, Factory, chance, BigNumber } = require('../../../helpers')

const Exchange = require('../../../../lib/exchanges/simulation')
const { ExchangeOrder, Market, Balance } = require('../../../../lib/models')

describe('Exchanges: Simulation', () => {
  describe('#createOrder when type is LIMIT', () => {
    describe('and base and quote quantity are within Market limits', () => {
      const market = Factory('market').build({ symbol: 'BTC/USDT' })
      const candle = {
        open: chance.floating({ min: 30, max: 50 }),
        high: chance.floating({ min: 90, max: 100 }),
        low: chance.floating({ min: 10, max: 30 }),
        close: chance.floating({ min: 70, max: 90 })
      }
      const tick = chance.floating({ min: candle.low, max: candle.high })
      const orderOptions = {
        exchange: 'binance',
        market: market.symbol,
        side: ExchangeOrder.sides.BUY,
        type: ExchangeOrder.types.LIMIT,
        price: 10,
        baseQuantity: 10,
        quoteQuantity: 100
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

      describe('and side is BUY', () => {
        it('locks quote asset', () => {
          const quoteQuantity = 100

          exchange.setTick(tick)
          exchange.setCandle(candle)

          expect(exchange.getBalance(market.quote)).to.deep.include({ free: '100000', used: '0' })

          exchange.createOrder({ ...orderOptions, quoteQuantity })

          const expectedUsed = BigNumber(quoteQuantity).toFixed()

          expect(exchange.getBalance(market.quote).free).to.eql(BigNumber(100000).minus(expectedUsed).toFixed())
          expect(exchange.getBalance(market.quote).used).to.eql(BigNumber(quoteQuantity).toFixed())
        })
      })

      describe('and side is SELL', () => {
        it('locks base asset', () => {
          const baseQuantity = 100
          const quoteQuantity = 1000

          exchange.setTick(tick)
          exchange.setCandle(candle)

          expect(exchange.getBalance(market.base)).to.deep.include({ free: '1000', used: '0' })

          exchange.createOrder({ ...orderOptions, side: ExchangeOrder.sides.SELL, baseQuantity, quoteQuantity })

          const expectedUsed = BigNumber(baseQuantity).toFixed()

          expect(exchange.getBalance(market.base).free).to.eql(BigNumber(1000).minus(expectedUsed).toFixed())
          expect(exchange.getBalance(market.base).used).to.eql(expectedUsed)
        })
      })
    })

    describe('and base quantity is for less than Market minimum amount', () => {
      const market = Factory('market').build({ limits: { amount: { min: 0.01 } } })

      let exchange

      before(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 1, used: 1, total: 0 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]
        exchange = new Exchange({ markets: [market], balances })
      })

      it('throws an error', () => {
        let thrownErr = null

        try {
          exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: ExchangeOrder.sides.SELL,
            type: ExchangeOrder.types.LIMIT,
            price: 10000,
            baseQuantity: 0.001
          })
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantity is lower than exchange minimum amount')
      })
    })

    describe('and base quantity is for more than Market maximum amount', () => {
      const market = Factory('market').build({ limits: { amount: { max: 10.00 } } })

      let exchange

      before(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 0, used: 0, total: 0 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]
        exchange = new Exchange({ markets: [market], balances })
      })

      it('throws an error', () => {
        let thrownErr = null

        try {
          exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: ExchangeOrder.sides.BUY,
            type: ExchangeOrder.types.LIMIT,
            price: 1,
            quoteQuantity: 100
          })
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantity is greater than exchange maximum amount')
      })
    })

    describe('and quote quantity is for less than Market minimum cost', () => {
      const market = Factory('market').build({ limits: { cost: { min: 10.00 } } })

      let exchange

      before(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 0, used: 0, total: 0 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]
        exchange = new Exchange({ markets: [market], balances })
      })

      it('throws an error', () => {
        let thrownErr = null

        try {
          exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: ExchangeOrder.sides.BUY,
            type: ExchangeOrder.types.LIMIT,
            price: 1,
            quoteQuantity: 1
          })
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantity is lower than exchange minimum cost')
      })
    })

    describe('and quote quantity is for more than Market maximum cost', () => {
      const market = new Market({
        symbol: 'BTC/USDT',
        base: 'BTC',
        quote: 'USDT',
        limits: { cost: { max: 10.00 } }
      })

      let exchange

      before(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 0, used: 0, total: 0 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]
        exchange = new Exchange({ markets: [market], balances })
      })

      it('throws an error', () => {
        let thrownErr = null

        try {
          exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: ExchangeOrder.sides.BUY,
            type: ExchangeOrder.types.LIMIT,
            price: 1,
            quoteQuantity: 100
          })
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantity is greater than exchange maximum cost')
      })
    })
  })
})
