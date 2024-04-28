const { expect, Factory, behaviours, chance, BigNumber, moment } = require('../../../helpers')

const Exchange = require('../../../../lib/exchanges/simulation')
const { OrderOptions, Balance } = require('../../../../lib/models')

describe('Exchanges: Simulation', () => {
  describe('#createOrder when type is MARKET', () => {
    const candle = {
      timestamp: moment().utc().subtract(5, 'minutes').toDate(),
      open: chance.floating({ min: 30, max: 50 }),
      high: chance.floating({ min: 90, max: 100 }),
      low: chance.floating({ min: 10, max: 30 }),
      close: chance.floating({ min: 70, max: 90 })
    }
    const tick = chance.floating({ min: candle.low, max: candle.high })

    describe('and no tick is set', () => {
      behaviours.throwsSimulationExchangeError('throws an error', {
        check: () => {
          const market = Factory('market').build({ symbol: 'BTC/USDT' })
          const balance = Factory('balance').build({ symbol: market.quote })
          const exchange = new Exchange({ markets: [market], balances: [balance] })

          exchange.setCandle(candle)
          exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: OrderOptions.sides.BUY,
            type: OrderOptions.types.MARKET,
            quoteQuantity: chance.floating({ min: 10, max: 100 })
          })
        },
        expect: error => expect(error.message).to.eql('tick and candle should be set with setTick() and setCandle()')
      })
    })

    describe('and no candle is set', () => {
      behaviours.throwsSimulationExchangeError('throws an error', {
        check: () => {
          const market = Factory('market').build({ symbol: 'BTC/USDT' })
          const balance = Factory('balance').build({ symbol: market.quote })
          const exchange = new Exchange({ markets: [market], balances: [balance] })

          exchange.setTick(tick)
          exchange.createOrder({
            exchange: 'binance',
            market: market.symbol,
            side: OrderOptions.sides.BUY,
            type: OrderOptions.types.MARKET,
            quoteQuantity: chance.floating({ min: 10, max: 100 })
          })
        },
        expect: error => expect(error.message).to.eql('tick and candle should be set with setTick() and setCandle()')
      })
    })

    describe('and tick and candle are set', () => {
      describe('and base and quote quantity are within Market limits', () => {
        const market = Factory('market').build({ symbol: 'BTC/USDT' })
        const baseBalance = { symbol: market.base, free: 0, used: 0, total: 0 }
        const quoteBalance = { symbol: market.quote, free: 100000, used: 0, total: 100000 }
        const orderOptions = {
          exchange: 'binance',
          market: market.symbol,
          side: OrderOptions.sides.BUY,
          type: OrderOptions.types.MARKET,
          quoteQuantity: chance.floating({ min: 10, max: 100 })
        }

        let exchange

        beforeEach(() => {
          const balances = [new Balance(baseBalance), new Balance(quoteBalance)]
          exchange = new Exchange({ markets: [market], balances })

          exchange.setTick(tick)
          exchange.setCandle(candle)
        })

        it('emulates MARKET order with slippage', () => {
          exchange.createOrder({ ...orderOptions })

          const order = exchange.getOrders()[0]
          const trade = order.trades[0]
          const high = BigNumber(tick).multipliedBy(1.001)
          const low = BigNumber(tick).multipliedBy(0.999)

          expect(order.status).to.eql('FILLED')
          expect(order.averagePrice).to.eql(trade.price)
          expect(order.trades.length).to.eql(1)
          expect(order.closedAt).to.eql(order.timestamp)

          expect(Number(trade.price)).to.be.least(BigNumber(low).toNumber())
          expect(Number(trade.price)).to.be.most(BigNumber(high).toNumber())
        })

        it('correctly updates balances', () => {
          exchange.createOrder({ ...orderOptions })

          const order = exchange.getOrders()[0]

          expect(exchange.getBalance(market.base)).to.deep.include({
            total: BigNumber(baseBalance.total).plus(order.baseQuantityNet).toFixed(),
            used: '0',
            free: BigNumber(baseBalance.total).plus(order.baseQuantityNet).toFixed()
          })

          expect(exchange.getBalance(market.quote)).to.deep.include({
            total: BigNumber(quoteBalance.total).minus(order.quoteQuantityGross).toFixed(),
            used: '0',
            free: BigNumber(quoteBalance.total).minus(order.quoteQuantityGross).toFixed()
          })
        })
      })

      describe('and base quantity is for less than Market minimum amount', () => {
        const market = Factory('market').build({ limits: { amount: { min: 0.01 } } })

        let exchange

        before(() => {
          const balances = [
            new Balance({ symbol: market.base, free: 0, used: 0, total: 0 }),
            new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
          ]
          exchange = new Exchange({ markets: [market], balances })

          exchange.setTick(10000)
          exchange.setCandle({
            timestamp: moment().utc().subtract(5, 'minutes').toDate(),
            open: 95000,
            high: 11000,
            low: 9000,
            close: 10500
          })
        })

        behaviours.throwsValidationError('throws an error', {
          check: () => {
            exchange.createOrder({
              exchange: 'binance',
              market: market.symbol,
              side: OrderOptions.sides.BUY,
              type: OrderOptions.types.MARKET,
              quoteQuantity: 10
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
            new Balance({ symbol: market.base, free: 0, used: 0, total: 0 }),
            new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
          ]
          exchange = new Exchange({ markets: [market], balances })

          exchange.setTick(1)
          exchange.setCandle({
            timestamp: moment().utc().subtract(5, 'minutes').toDate(),
            open: 0.95,
            high: 1.1,
            low: 0.9,
            close: 1.05
          })
        })

        behaviours.throwsValidationError('throws an error', {
          check: () => {
            exchange.createOrder({
              exchange: 'binance',
              market: market.symbol,
              side: OrderOptions.sides.BUY,
              type: OrderOptions.types.MARKET,
              quoteQuantity: 100
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
            new Balance({ symbol: market.base, free: 0, used: 0, total: 0 }),
            new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
          ]
          exchange = new Exchange({ markets: [market], balances })

          exchange.setTick(1)
          exchange.setCandle({
            timestamp: moment().utc().subtract(5, 'minutes').toDate(),
            open: 0.95,
            high: 1.10,
            low: 0.90,
            close: 1.05
          })
        })

        behaviours.throwsValidationError('throws an error', {
          check: () => {
            exchange.createOrder({
              exchange: 'binance',
              market: market.symbol,
              side: OrderOptions.sides.BUY,
              type: OrderOptions.types.MARKET,
              quoteQuantity: 1
            })
          },
          expect: error => expect(error.data[0].message).to.eql('quoteQuantity is lower than exchange minimum cost')
        })
      })

      describe('and quote quantity is for more than Market maximum cost', () => {
        const market = Factory('market').build({ limits: { cost: { max: 10.00 } } })

        let exchange

        before(() => {
          const balances = [
            new Balance({ symbol: market.base, free: 0, used: 0, total: 0 }),
            new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
          ]
          exchange = new Exchange({ markets: [market], balances })

          exchange.setTick(10)
          exchange.setCandle({
            timestamp: moment().utc().subtract(5, 'minutes').toDate(),
            open: 9.5,
            high: 11.0,
            low: 9.0,
            close: 10.5
          })
        })

        behaviours.throwsValidationError('throws an error', {
          check: () => {
            exchange.createOrder({
              exchange: 'binance',
              market: market.symbol,
              side: OrderOptions.sides.BUY,
              type: OrderOptions.types.MARKET,
              quoteQuantity: 11
            })
          },
          expect: error => expect(error.data[0].message).to.eql('quoteQuantity is greater than exchange maximum cost')
        })
      })
    })
  })
})
