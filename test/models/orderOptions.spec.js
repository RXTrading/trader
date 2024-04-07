const { expect, chance, behaviours } = require('../helpers')

const OrderOptions = require('../../lib/models/orderOptions')

describe('OrderOptions Model', () => {
  it('has sides', () => {
    expect(OrderOptions.sides).to.eql({ BUY: 'BUY', SELL: 'SELL' })
  })

  it('has types', () => {
    expect(OrderOptions.types).to.eql({
      MARKET: 'MARKET',
      LIMIT: 'LIMIT',
      STOP_LOSS: 'STOP_LOSS',
      STOP_LOSS_LIMIT: 'STOP_LOSS_LIMIT',
      TAKE_PROFIT: 'TAKE_PROFIT',
      TAKE_PROFIT_LIMIT: 'TAKE_PROFIT_LIMIT'
    })
  })

  it('has market types', () => {
    expect(OrderOptions.marketTypes).to.eql([OrderOptions.types.MARKET, OrderOptions.types.STOP_LOSS, OrderOptions.types.TAKE_PROFIT])
  })

  it('has limit types', () => {
    expect(OrderOptions.limitTypes).to.eql([OrderOptions.types.LIMIT, OrderOptions.types.STOP_LOSS_LIMIT, OrderOptions.types.TAKE_PROFIT_LIMIT])
  })

  it('has buy types', () => {
    expect(OrderOptions.buyTypes).to.eql([OrderOptions.types.MARKET, OrderOptions.types.LIMIT])
  })

  describe('params', () => {
    const defaultParams = {
      exchange: 'binance',
      market: 'BTC/USDT',
      timestamp: chance.date(),
      side: OrderOptions.sides.BUY,
      type: OrderOptions.types.LIMIT,
      price: chance.integer({ min: 1, max: 100 }),
      quoteQuantity: 1000.00
    }

    describe('props', () => {
      describe('exchange', () => {
        behaviours.throwsValidationError('is required', {
          check: () => (new OrderOptions({ ...defaultParams, exchange: undefined })),
          expect: error => expect(error.data[0].message).to.eql('exchange is required')
        })

        behaviours.throwsValidationError('must be a string', {
          check: () => (new OrderOptions({ ...defaultParams, exchange: chance.integer() })),
          expect: error => expect(error.data[0].message).to.eql('exchange must be a string')
        })
      })

      describe('market', () => {
        behaviours.throwsValidationError('is required', {
          check: () => (new OrderOptions({ ...defaultParams, market: undefined })),
          expect: error => expect(error.data[0].message).to.eql('market is required')
        })

        behaviours.throwsValidationError('must be a string', {
          check: () => (new OrderOptions({ ...defaultParams, market: chance.integer() })),
          expect: error => expect(error.data[0].message).to.eql('market must be a string')
        })
      })

      describe('timestamp', () => {
        behaviours.throwsValidationError('must be a date', {
          check: () => (new OrderOptions({ ...defaultParams, timestamp: 'tomorrow' })),
          expect: error => expect(error.data[0].message).to.eql('timestamp must be a Date')
        })

        it('defaults to current time', () => {
          const model = new OrderOptions({ ...defaultParams, timestamp: undefined })

          expect(model.timestamp).not.to.be.null()
          expect(model.timestamp).be.closeToTime(new Date(), 1)
        })
      })

      describe('side', () => {
        behaviours.throwsValidationError('is required', {
          check: () => (new OrderOptions({ ...defaultParams, side: undefined })),
          expect: error => expect(error.data[0].message).to.eql('side is required')
        })

        behaviours.throwsValidationError('must match', {
          check: () => (new OrderOptions({ ...defaultParams, side: chance.string({ max: 5, aplha: true }) })),
          expect: error => expect(error.data[0].message).to.eql(`side must match one of ${Object.values(OrderOptions.sides).join(', ')}`)
        })
      })

      describe('type', () => {
        behaviours.throwsValidationError('is required', {
          check: () => (new OrderOptions({ ...defaultParams, type: undefined })),
          expect: error => expect(error.data[0].message).to.eql('type is required')
        })

        behaviours.throwsValidationError('must match', {
          check: () => (new OrderOptions({ ...defaultParams, type: chance.string({ max: 5, aplha: true }) })),
          expect: error => expect(error.data[0].message).to.eql(`type must match one of ${Object.values(OrderOptions.types).join(', ')}`)
        })

        describe('when side is BUY and type is a STOP', () => {
          behaviours.throwsValidationError('is not supported', {
            check: () => (
              new OrderOptions({
                ...defaultParams,
                side: OrderOptions.sides.BUY,
                type: OrderOptions.types.STOP_LOSS_LIMIT
              })
            ),
            expect: error => expect(error.data[0].message).to.eql('type does not support BUY')
          })
        })

        describe('when side is BUY and type is a TAKE PROFIT', () => {
          behaviours.throwsValidationError('is not supported', {
            check: () => (
              new OrderOptions({
                ...defaultParams,
                side: OrderOptions.sides.BUY,
                type: OrderOptions.types.TAKE_PROFIT
              })
            ),
            expect: error => expect(error.data[0].message).to.eql('type does not support BUY')
          })
        })
      })

      describe('baseQuantity', () => {
        behaviours.throwsValidationError('must be a number', {
          check: () => (new OrderOptions({ ...defaultParams, baseQuantity: 'seventy' })),
          expect: error => expect(error.data[0].message).to.eql('baseQuantity must be a number')
        })

        behaviours.throwsValidationError('must be greater than or equal to 0', {
          check: () => (new OrderOptions({ ...defaultParams, baseQuantity: -1 })),
          expect: error => expect(error.data[0].message).to.eql('baseQuantity must be greater than or equal to 0')
        })

        describe('when type is MARKET', () => {
          describe('and neither baseQuantity or quoteQuantity are provided', () => {
            behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
              check: () => (
                new OrderOptions({
                  ...defaultParams,
                  type: OrderOptions.types.MARKET,
                  baseQuantity: undefined,
                  quoteQuantity: undefined
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('baseQuantity or quoteQuantity is required')
            })
          })

          describe('and both baseQuantity and quoteQuantity are provided', () => {
            behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
              check: () => (
                new OrderOptions({
                  ...defaultParams,
                  type: OrderOptions.types.MARKET,
                  baseQuantity: 100,
                  quoteQuantity: 100
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('baseQuantity or quoteQuantity is required')
            })
          })
        })

        describe('when type is LIMIT', () => {
          describe('and neither baseQuantity or quoteQuantity are provided', () => {
            behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
              check: () => (
                new OrderOptions({
                  ...defaultParams,
                  type: OrderOptions.types.LIMIT,
                  side: OrderOptions.sides.BUY,
                  baseQuantity: undefined,
                  quoteQuantity: undefined
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('baseQuantity or quoteQuantity is required')
            })
          })

          describe('and both baseQuantity and quoteQuantity are provided', () => {
            behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
              check: () => (
                new OrderOptions({
                  ...defaultParams,
                  type: OrderOptions.types.LIMIT,
                  side: OrderOptions.sides.SELL,
                  baseQuantity: 100,
                  quoteQuantity: 100
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('baseQuantity or quoteQuantity is required')
            })
          })
        })

        describe('when type is not MARKET or LIMIT', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (
              new OrderOptions({
                ...defaultParams,
                type: OrderOptions.types.STOP_LOSS_LIMIT,
                side: OrderOptions.sides.SELL,
                baseQuantity: undefined,
                quoteQuantity: undefined
              })
            ),
            expect: error => expect(error.data[0].message).to.eql('baseQuantity is required')
          })
        })
      })

      describe('quoteQuantity', () => {
        behaviours.throwsValidationError('must be a number', {
          check: () => (new OrderOptions({ ...defaultParams, quoteQuantity: 'seventy' })),
          expect: error => expect(error.data[0].message).to.eql('quoteQuantity must be a number')
        })

        behaviours.throwsValidationError('must be greater than or equal to 0', {
          check: () => (new OrderOptions({ ...defaultParams, quoteQuantity: -1 })),
          expect: error => expect(error.data[0].message).to.eql('quoteQuantity must be greater than or equal to 0')
        })
      })

      describe('price', () => {
        behaviours.throwsValidationError('must be a number', {
          check: () => (new OrderOptions({ ...defaultParams, price: 'seventy' })),
          expect: error => expect(error.data[0].message).to.eql('price must be a number')
        })

        behaviours.throwsValidationError('must be greater than or equal to 0', {
          check: () => (new OrderOptions({ ...defaultParams, price: -1 })),
          expect: error => expect(error.data[0].message).to.eql('price must be greater than or equal to 0')
        })

        describe('when type has LIMIT', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (
              new OrderOptions({
                ...defaultParams,
                type: OrderOptions.types.STOP_LOSS_LIMIT,
                side: OrderOptions.sides.SELL,
                baseQuantity: 100,
                quoteQuantity: undefined,
                price: undefined
              })
            ),
            expect: error => expect(error.data[0].message).to.eql('price is required')
          })
        })
      })

      describe('stopPrice', () => {
        behaviours.throwsValidationError('must be a number', {
          check: () => (new OrderOptions({ ...defaultParams, stopPrice: 'seventy' })),
          expect: error => expect(error.data[0].message).to.eql('stopPrice must be a number')
        })

        behaviours.throwsValidationError('must be greater than or equal to 0', {
          check: () => (new OrderOptions({ ...defaultParams, stopPrice: -1 })),
          expect: error => expect(error.data[0].message).to.eql('stopPrice must be greater than or equal to 0')
        })

        describe('when type is MARKET', () => {
          it('defaults to underfined', () => {
            const model = new OrderOptions({ ...defaultParams, type: 'MARKET', stopPrice: undefined })

            expect(model.stopPrice).to.undefined()
          })
        })

        describe('when type has STOP_LOSS', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (
              new OrderOptions({
                ...defaultParams,
                type: OrderOptions.types.STOP_LOSS_LIMIT,
                side: OrderOptions.sides.SELL,
                baseQuantity: 100,
                quoteQuantity: undefined,
                stopPrice: undefined
              })
            ),
            expect: error => expect(error.data[0].message).to.eql('stopPrice is required')
          })
        })

        describe('when type has TAKE_PROFIT', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (
              new OrderOptions({
                ...defaultParams,
                type: OrderOptions.types.TAKE_PROFIT,
                side: OrderOptions.sides.SELL,
                baseQuantity: 100,
                quoteQuantity: undefined,
                stopPrice: undefined
              })
            ),
            expect: error => expect(error.data[0].message).to.eql('stopPrice is required')
          })
        })
      })
    })
  })
})
