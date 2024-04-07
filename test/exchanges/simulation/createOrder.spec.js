const { expect, Factory, behaviours, chance, BigNumber } = require('../../helpers')

const Exchange = require('../../../lib/exchanges/simulation')
const { OrderOptions } = require('../../../lib/models')

describe('Exchanges: Simulation', () => {
  describe('#createOrder', () => {
    describe('options', () => {
      const market = Factory('market').build({ symbol: 'BTC/USDT' })
      const defaultParams = {
        exchange: 'binance',
        market: market.symbol,
        side: OrderOptions.sides.BUY,
        type: OrderOptions.types.LIMIT,
        price: chance.floating({ min: 10, max: 100 }),
        quoteQuantity: chance.floating({ min: 10, max: 100 })
      }

      let exchange

      beforeEach(() => {
        exchange = new Exchange({
          markets: [
            market,
            Factory('market').build({ symbol: 'LTC/USDT' }),
            Factory('market').build({ symbol: 'ETH/LTC' })
          ],
          balances: [
            Factory('balance').build({ symbol: market.base, free: 1, used: 0, total: 1 }),
            Factory('balance').build({ symbol: market.quote, free: 1000, used: 0, total: 1000 })
          ]
        })
      })

      describe('market', () => {
        behaviours.throwsValidationError('is required', {
          check: () => exchange.createOrder({ ...defaultParams, market: undefined }),
          expect: error => expect(error.data[0].message).to.eql('market is required')
        })

        behaviours.throwsValidationError('must exist', {
          check: () => exchange.createOrder({ ...defaultParams, market: chance.string() }),
          expect: error => expect(error.data[0].message).to.eql('market does not exist')
        })
      })

      describe('baseQuantity', () => {
        describe('when side is SELL', () => {
          describe('and no local balance for base', () => {
            behaviours.throwsValidationError('throws an error', {
              check: () => exchange.createOrder({
                ...defaultParams,
                market: 'LTC/USDT',
                side: OrderOptions.sides.SELL,
                baseQuantity: 1,
                quoteQuantity: undefined
              }),
              expect: error => expect(error.data[0].message).to.eql('no matching base balance')
            })
          })

          behaviours.throwsValidationError('throws an error', {
            check: () => exchange.createOrder({
              ...defaultParams,
              side: OrderOptions.sides.SELL,
              baseQuantity: 2,
              quoteQuantity: undefined
            }),
            expect: error => expect(error.data[0].message).to.eql('baseQuantity is greater than available balance')
          })
        })

        it('converts to BigNumber', () => {
          const baseQuantity = 1

          exchange.createOrder({
            ...defaultParams,
            side: OrderOptions.sides.SELL,
            baseQuantity,
            quoteQuantity: undefined
          })

          expect(exchange.getOrders()[0].baseQuantity).to.eql(BigNumber(baseQuantity).toFixed())
        })
      })

      describe('quoteQuantity', () => {
        describe('when side is BUY', () => {
          describe('and no local balance for quote', () => {
            behaviours.throwsValidationError('throws an error', {
              check: () => exchange.createOrder({ ...defaultParams, market: 'ETH/LTC', side: 'BUY', baseQuantity: undefined, quoteQuantity: 100 }),
              expect: error => expect(error.data[0].message).to.eql('no matching quote balance')
            })
          })

          behaviours.throwsValidationError('throws an error', {
            check: () => exchange.createOrder({ ...defaultParams, market: 'BTC/USDT', side: 'BUY', baseQuantity: undefined, quoteQuantity: 1001 }),
            expect: error => expect(error.data[0].message).to.eql('quoteQuantity is greater than available balance')
          })
        })

        it('converts to BigNumber', () => {
          const quoteQuantity = BigNumber(chance.integer({ min: 100, max: 1000 }))
          exchange.createOrder({ ...defaultParams, baseQuantity: undefined, quoteQuantity: quoteQuantity.toNumber() })

          expect(exchange.getOrders()[0].quoteQuantity).to.eql(quoteQuantity.toFixed())
        })
      })
    })

    describe('when order is valid', () => {
      it('creates MARKET orders', () => {
        const exchange = new Exchange({
          markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
          balances: [
            Factory('balance').build({ symbol: 'BTC' }),
            Factory('balance').build({
              symbol: 'USDT',
              free: chance.integer({ min: 100000 }),
              used: chance.integer({ min: 0 }),
              total: chance.integer({ min: 100000 })
            })
          ]
        })

        exchange.setTick(1)
        exchange.setCandle({ open: 0.95, high: 1.1, low: 0.9, close: 1.05 })

        expect(exchange.getOrders().length).to.eql(0)

        exchange.createOrder({
          exchange: 'binance',
          market: 'BTC/USDT',
          side: OrderOptions.sides.BUY,
          type: OrderOptions.types.MARKET,
          quoteQuantity: chance.floating({ min: 100, max: 1000 })
        })

        expect(exchange.getOrders().length).to.eql(1)
      })

      it('creates LIMIT orders', () => {
        const exchange = new Exchange({
          markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
          balances: [
            Factory('balance').build({ symbol: 'BTC' }),
            Factory('balance').build({
              symbol: 'USDT',
              free: chance.integer({ min: 100000 }),
              used: chance.integer({ min: 0 }),
              total: chance.integer({ min: 100000 })
            })
          ]
        })

        expect(exchange.getOrders().length).to.eql(0)

        exchange.createOrder({
          exchange: 'binance',
          market: 'BTC/USDT',
          side: OrderOptions.sides.BUY,
          type: OrderOptions.types.LIMIT,
          price: chance.floating({ min: 10, max: 100 }),
          quoteQuantity: chance.floating({ min: 10, max: 100 })
        })

        expect(exchange.getOrders().length).to.eql(1)
      })

      it('creates STOP_LOSS orders', () => {
        const exchange = new Exchange({
          markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
          balances: [
            Factory('balance').build({
              symbol: 'BTC',
              free: chance.integer({ min: 100000 }),
              used: chance.integer({ min: 0 }),
              total: chance.integer({ min: 100000 })
            }),
            Factory('balance').build({ symbol: 'USDT' })
          ]
        })

        exchange.setTick(1)
        exchange.setCandle({ open: 0.95, high: 1.1, low: 0.9, close: 1.05 })

        expect(exchange.getOrders().length).to.eql(0)

        exchange.createOrder({
          exchange: 'binance',
          market: 'BTC/USDT',
          side: OrderOptions.sides.SELL,
          type: OrderOptions.types.STOP_LOSS,
          stopPrice: chance.floating({ min: 10, max: 100 }),
          baseQuantity: chance.floating({ min: 10, max: 100 })
        })

        expect(exchange.getOrders().length).to.eql(1)
      })

      it('creates STOP_LOSS_LIMIT orders', () => {
        const exchange = new Exchange({
          markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
          balances: [
            Factory('balance').build({
              symbol: 'BTC',
              free: chance.integer({ min: 100000 }),
              used: chance.integer({ min: 0 }),
              total: chance.integer({ min: 100000 })
            }),
            Factory('balance').build({ symbol: 'USDT' })
          ]
        })
        expect(exchange.getOrders().length).to.eql(0)

        exchange.createOrder({
          exchange: 'binance',
          market: 'BTC/USDT',
          side: OrderOptions.sides.SELL,
          type: OrderOptions.types.STOP_LOSS_LIMIT,
          stopPrice: 10,
          price: 9,
          baseQuantity: chance.floating({ min: 10, max: 100 })
        })

        expect(exchange.getOrders().length).to.eql(1)
      })

      it('creates TAKE_PROFIT orders', () => {
        const exchange = new Exchange({
          markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
          balances: [
            Factory('balance').build({
              symbol: 'BTC',
              free: chance.integer({ min: 100000 }),
              used: chance.integer({ min: 0 }),
              total: chance.integer({ min: 100000 })
            }),
            Factory('balance').build({ symbol: 'USDT' })
          ]
        })

        exchange.setTick(1)
        exchange.setCandle({ open: 0.95, high: 1.1, low: 0.9, close: 1.05 })

        expect(exchange.getOrders().length).to.eql(0)

        exchange.createOrder({
          exchange: 'binance',
          market: 'BTC/USDT',
          side: OrderOptions.sides.SELL,
          type: OrderOptions.types.TAKE_PROFIT,
          stopPrice: chance.floating({ min: 10, max: 100 }),
          baseQuantity: chance.floating({ min: 10, max: 100 })
        })

        expect(exchange.getOrders().length).to.eql(1)
      })

      it('creates TAKE_PROFIT_LIMIT orders', () => {
        const exchange = new Exchange({
          markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
          balances: [
            Factory('balance').build({
              symbol: 'BTC',
              free: chance.integer({ min: 100000 }),
              used: chance.integer({ min: 0 }),
              total: chance.integer({ min: 100000 })
            }),
            Factory('balance').build({ symbol: 'USDT' })
          ]
        })

        expect(exchange.getOrders().length).to.eql(0)

        exchange.createOrder({
          exchange: 'binance',
          market: 'BTC/USDT',
          side: OrderOptions.sides.SELL,
          type: OrderOptions.types.TAKE_PROFIT_LIMIT,
          stopPrice: 10,
          price: 9,
          baseQuantity: chance.floating({ min: 10, max: 100 })
        })

        expect(exchange.getOrders().length).to.eql(1)
      })
    })

    describe('when order is invalid', () => {
      behaviours.throwsValidationError('throws an error', {
        check: () => {
          const exchange = new Exchange({
            markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
            balances: [
              Factory('balance').build({
                symbol: 'BTC',
                free: chance.integer({ min: 100000 }),
                used: chance.integer({ min: 0 }),
                total: chance.integer({ min: 100000 })
              }),
              Factory('balance').build({ symbol: 'USDT' })
            ]
          })

          exchange.createOrder({
            exchange: 'binance',
            market: 'BTC/USDT',
            side: OrderOptions.sides.SELL
          })
        },
        expect: error => expect(error.data[0].message).to.eql('type is required')
      })
    })
  })
})
