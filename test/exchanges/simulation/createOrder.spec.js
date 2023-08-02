const { expect, Factory, chance, BigNumber } = require('../../helpers')

const Exchange = require('../../../lib/exchanges/simulation')
const { ExchangeOrder } = require('../../../lib/models')

describe('Exchanges: Simulation', () => {
  describe('#createOrder', () => {
    describe('options', () => {
      const market = Factory('market').build({ symbol: 'BTC/USDT' })
      const defaultParams = {
        exchange: 'binance',
        market: market.symbol,
        side: ExchangeOrder.sides.BUY,
        type: ExchangeOrder.types.LIMIT,
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

      describe('exchange', () => {
        it('is required', () => {
          let thrownErr = null

          try {
            exchange.createOrder({ ...defaultParams, exchange: undefined })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('exchange is required')
        })

        it('must be a string', () => {
          let thrownErr = null

          try {
            exchange.createOrder({ ...defaultParams, exchange: chance.bool() })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('exchange must be a string')
        })
      })

      describe('market', () => {
        it('is required', () => {
          let thrownErr = null

          try {
            exchange.createOrder({ ...defaultParams, market: undefined })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('market is required')
        })

        it('must exist', () => {
          let thrownErr = null

          try {
            exchange.createOrder({ ...defaultParams, market: chance.string() })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('market does not exist')
        })
      })

      describe('side', () => {
        it('is required', () => {
          let thrownErr = null

          try {
            exchange.createOrder({ ...defaultParams, side: undefined })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('side is required')
        })

        it('must match', () => {
          let thrownErr = null

          try {
            exchange.createOrder({ ...defaultParams, side: chance.string({ max: 5, aplha: true }) })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql(`side must match one of ${Object.values(ExchangeOrder.sides).join(', ')}`)
        })
      })

      describe('type', () => {
        it('is required', () => {
          let thrownErr = null

          try {
            exchange.createOrder({ ...defaultParams, type: undefined })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('type is required')
        })

        it('must match', () => {
          let thrownErr = null

          try {
            exchange.createOrder({ ...defaultParams, type: chance.string({ max: 5, aplha: true }) })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql(`type must match one of ${Object.values(ExchangeOrder.types).join(', ')}`)
        })
      })

      describe('baseQuantity', () => {
        describe('when side is SELL', () => {
          describe('and no local balance for base', () => {
            it('throws an error', () => {
              let thrownErr = null

              try {
                exchange.createOrder({
                  ...defaultParams,
                  market: 'LTC/USDT',
                  side: ExchangeOrder.sides.SELL,
                  baseQuantity: 1,
                  quoteQuantity: undefined
                })
              } catch (err) {
                thrownErr = err
              }

              expect(thrownErr.type).to.eql('VALIDATION_ERROR')
              expect(thrownErr.data[0].message).to.eql('no matching base balance')
            })
          })

          it('must not be greater than local base balance', () => {
            let thrownErr = null

            try {
              exchange.createOrder({
                ...defaultParams,
                side: ExchangeOrder.sides.SELL,
                baseQuantity: 2,
                quoteQuantity: undefined
              })
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('baseQuantity is greater than available balance')
          })
        })

        it('converts to BigNumber', () => {
          const baseQuantity = 1

          exchange.createOrder({
            ...defaultParams,
            side: ExchangeOrder.sides.SELL,
            baseQuantity,
            quoteQuantity: undefined
          })

          expect(exchange.getOrders()[0].baseQuantity).to.eql(BigNumber(baseQuantity).toFixed())
        })
      })

      describe('quoteQuantity', () => {
        describe('when side is BUY', () => {
          describe('and no local balance for quote', () => {
            it('throws an error', () => {
              let thrownErr = null

              try {
                exchange.createOrder({ ...defaultParams, market: 'ETH/LTC', side: 'BUY', baseQuantity: undefined, quoteQuantity: 100 })
              } catch (err) {
                thrownErr = err
              }

              expect(thrownErr.type).to.eql('VALIDATION_ERROR')
              expect(thrownErr.data[0].message).to.eql('no matching quote balance')
            })
          })

          it('must not be greater than local quote balance', () => {
            let thrownErr = null

            try {
              exchange.createOrder({ ...defaultParams, market: 'BTC/USDT', side: 'BUY', baseQuantity: undefined, quoteQuantity: 1001 })
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('quoteQuantity is greater than available balance')
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
          side: ExchangeOrder.sides.BUY,
          type: ExchangeOrder.types.MARKET,
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
          side: ExchangeOrder.sides.BUY,
          type: ExchangeOrder.types.LIMIT,
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
          side: ExchangeOrder.sides.SELL,
          type: ExchangeOrder.types.STOP_LOSS,
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
          side: ExchangeOrder.sides.SELL,
          type: ExchangeOrder.types.STOP_LOSS_LIMIT,
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
          side: ExchangeOrder.sides.SELL,
          type: ExchangeOrder.types.TAKE_PROFIT,
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
          side: ExchangeOrder.sides.SELL,
          type: ExchangeOrder.types.TAKE_PROFIT_LIMIT,
          stopPrice: 10,
          price: 9,
          baseQuantity: chance.floating({ min: 10, max: 100 })
        })

        expect(exchange.getOrders().length).to.eql(1)
      })
    })

    describe('when order is invalid', () => {
      it('throws an error', () => {
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

        let thrownErr = null

        try {
          exchange.createOrder({
            exchange: 'binance',
            market: 'BTC/USDT',
            side: ExchangeOrder.sides.SELL
          })
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('type is required')
      })
    })
  })
})
