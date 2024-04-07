const { expect, Factory, chance, behaviours } = require('../helpers')

const Order = require('../../lib/models/order')
const OrderOptions = require('../../lib/models/orderOptions')

describe('Order Model', () => {
  it('has statuses', () => {
    expect(Order.statuses).to.eql({ NEW: 'NEW', OPEN: 'OPEN', FILLED: 'FILLED', CANCELLED: 'CANCELLED' })
  })

  describe('params', () => {
    const defaultParams = {
      id: chance.guid({ version: 4 }),
      foreignId: chance.guid({ version: 4 }),
      exitId: chance.guid({ version: 4 }),
      timestamp: chance.date(),
      options: {
        exchange: 'binance',
        market: 'BTC/USDT',
        timestamp: chance.date(),
        side: OrderOptions.sides.BUY,
        type: OrderOptions.types.LIMIT,
        price: chance.integer({ min: 1, max: 100 }),
        quoteQuantity: 1000.00
      },
      exchange: 'binance',
      market: 'BTC/USDT',
      status: chance.pickone(Object.values(Order.statuses)),
      side: OrderOptions.sides.BUY,
      type: OrderOptions.types.LIMIT,
      baseQuantityGross: chance.integer({ min: 1, max: 1000 }),
      baseQuantityNet: chance.integer({ min: 1, max: 1000 }),
      quoteQuantityGross: chance.integer({ min: 1, max: 1000 }),
      quoteQuantityNet: chance.integer({ min: 1, max: 1000 }),
      price: chance.integer({ min: 1, max: 100 }),
      averagePrice: chance.integer({ min: 1, max: 100 }),
      trades: []
    }

    describe('id', () => {
      behaviours.throwsValidationError('must be a UUID', {
        check: () => (new Order({ ...defaultParams, id: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('id must be a valid UUID')
      })

      it('defaults to a UUID', () => {
        const model = new Order({ ...defaultParams, id: undefined })

        expect(model.id).be.a.uuid('v4')
      })
    })

    describe('foreignId', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Order({ ...defaultParams, foreignId: undefined })),
        expect: error => expect(error.data[0].message).to.eql('foreignId is required')
      })

      behaviours.throwsValidationError('must be a UUID', {
        check: () => (new Order({ ...defaultParams, foreignId: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('foreignId must be a valid UUID')
      })
    })

    describe('exitId', () => {
      behaviours.throwsValidationError('must be a UUID', {
        check: () => (new Order({ ...defaultParams, exitId: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('exitId must be a valid UUID')
      })
    })

    describe('timestamp', () => {
      behaviours.throwsValidationError('must be a date', {
        check: () => (new Order({ ...defaultParams, timestamp: 'tomorrow' })),
        expect: error => expect(error.data[0].message).to.eql('timestamp must be a Date')
      })

      it('defaults to current time', () => {
        const model = new Order({ ...defaultParams, timestamp: undefined })

        expect(model.timestamp).not.to.be.null()
        expect(model.timestamp).be.closeToTime(new Date(), 1)
      })
    })

    describe('options', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Order({ ...defaultParams, options: undefined })),
        expect: error => expect(error.data[0].message).to.eql('options is required')
      })

      behaviours.throwsValidationError('must be an object', {
        check: () => (new Order({ ...defaultParams, options: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('options must be an Object')
      })

      describe('props', () => {
        describe('exchange', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, exchange: undefined } })),
            expect: error => expect(error.data[0].message).to.eql('options.exchange is required')
          })

          behaviours.throwsValidationError('must be a string', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, exchange: chance.integer() } })),
            expect: error => expect(error.data[0].message).to.eql('options.exchange must be a string')
          })
        })

        describe('market', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, market: undefined } })),
            expect: error => expect(error.data[0].message).to.eql('options.market is required')
          })

          behaviours.throwsValidationError('must be a string', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, market: chance.integer() } })),
            expect: error => expect(error.data[0].message).to.eql('options.market must be a string')
          })
        })

        describe('timestamp', () => {
          behaviours.throwsValidationError('must be a date', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, timestamp: 'tomorrow' } })),
            expect: error => expect(error.data[0].message).to.eql('options.timestamp must be a Date')
          })

          it('defaults to current time', () => {
            const model = new Order({ ...defaultParams, options: { ...defaultParams.options, timestamp: undefined } })

            expect(model.options.timestamp).not.to.be.null()
            expect(model.options.timestamp).be.closeToTime(new Date(), 1)
          })
        })

        describe('side', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, side: undefined } })),
            expect: error => expect(error.data[0].message).to.eql('options.side is required')
          })

          behaviours.throwsValidationError('must match', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, side: chance.string({ max: 5, aplha: true }) } })),
            expect: error => expect(error.data[0].message).to.eql(`options.side must match one of ${Object.values(OrderOptions.sides).join(', ')}`)
          })
        })

        describe('type', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, type: undefined } })),
            expect: error => expect(error.data[0].message).to.eql('options.type is required')
          })

          behaviours.throwsValidationError('must match', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, type: chance.string({ max: 5, aplha: true }) } })),
            expect: error => expect(error.data[0].message).to.eql(`options.type must match one of ${Object.values(OrderOptions.types).join(', ')}`)
          })

          describe('when side is BUY and type is a STOP', () => {
            behaviours.throwsValidationError('is not supported', {
              check: () => (
                new Order({
                  ...defaultParams,
                  options: {
                    ...defaultParams.options,
                    side: OrderOptions.sides.BUY,
                    type: OrderOptions.types.STOP_LOSS_LIMIT
                  }
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('options.type does not support BUY')
            })
          })

          describe('when side is BUY and type is a TAKE PROFIT', () => {
            behaviours.throwsValidationError('is not supported', {
              check: () => (
                new Order({
                  ...defaultParams,
                  options: {
                    ...defaultParams.options,
                    side: OrderOptions.sides.BUY,
                    type: OrderOptions.types.TAKE_PROFIT
                  }
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('options.type does not support BUY')
            })
          })
        })

        describe('options.baseQuantity', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, baseQuantity: 'seventy' } })),
            expect: error => expect(error.data[0].message).to.eql('options.baseQuantity must be a number')
          })

          behaviours.throwsValidationError('must be greater than or equal to 0', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, baseQuantity: -1 } })),
            expect: error => expect(error.data[0].message).to.eql('options.baseQuantity must be greater than or equal to 0')
          })

          describe('when type is MARKET', () => {
            describe('and neither baseQuantity or quoteQuantity are provided', () => {
              behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                check: () => (
                  new Order({
                    ...defaultParams,
                    options: {
                      ...defaultParams.options,
                      type: OrderOptions.types.MARKET,
                      baseQuantity: undefined,
                      quoteQuantity: undefined
                    }
                  })
                ),
                expect: error => expect(error.data[0].message).to.eql('options.baseQuantity or options.quoteQuantity is required')
              })
            })

            describe('and both baseQuantity and quoteQuantity are provided', () => {
              behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                check: () => (
                  new Order({
                    ...defaultParams,
                    options: {
                      ...defaultParams.options,
                      type: OrderOptions.types.MARKET,
                      baseQuantity: 100,
                      quoteQuantity: 100
                    }
                  })
                ),
                expect: error => expect(error.data[0].message).to.eql('options.baseQuantity or options.quoteQuantity is required')
              })
            })
          })

          describe('when type is LIMIT', () => {
            describe('and neither baseQuantity or quoteQuantity are provided', () => {
              behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                check: () => (
                  new Order({
                    ...defaultParams,
                    options: {
                      ...defaultParams.options,
                      type: OrderOptions.types.LIMIT,
                      side: OrderOptions.sides.BUY,
                      baseQuantity: undefined,
                      quoteQuantity: undefined
                    }
                  })
                ),
                expect: error => expect(error.data[0].message).to.eql('options.baseQuantity or options.quoteQuantity is required')
              })
            })

            describe('and both baseQuantity and quoteQuantity are provided', () => {
              behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                check: () => (
                  new Order({
                    ...defaultParams,
                    options: {
                      ...defaultParams.options,
                      type: OrderOptions.types.LIMIT,
                      side: OrderOptions.sides.SELL,
                      baseQuantity: 100,
                      quoteQuantity: 100
                    }
                  })
                ),
                expect: error => expect(error.data[0].message).to.eql('options.baseQuantity or options.quoteQuantity is required')
              })
            })
          })

          describe('when type is not MARKET or LIMIT', () => {
            behaviours.throwsValidationError('is required', {
              check: () => (
                new Order({
                  ...defaultParams,
                  options: {
                    ...defaultParams.options,
                    type: OrderOptions.types.STOP_LOSS_LIMIT,
                    side: OrderOptions.sides.SELL,
                    baseQuantity: undefined,
                    quoteQuantity: undefined
                  }
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('options.baseQuantity is required')
            })
          })
        })

        describe('options.quoteQuantity', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, quoteQuantity: 'seventy' } })),
            expect: error => expect(error.data[0].message).to.eql('options.quoteQuantity must be a number')
          })

          behaviours.throwsValidationError('must be greater than or equal to 0', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, quoteQuantity: -1 } })),
            expect: error => expect(error.data[0].message).to.eql('options.quoteQuantity must be greater than or equal to 0')
          })
        })

        describe('price', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, price: 'seventy' } })),
            expect: error => expect(error.data[0].message).to.eql('options.price must be a number')
          })

          behaviours.throwsValidationError('must be greater than or equal to 0', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, price: -1 } })),
            expect: error => expect(error.data[0].message).to.eql('options.price must be greater than or equal to 0')
          })

          describe('when type has LIMIT', () => {
            behaviours.throwsValidationError('is required', {
              check: () => (
                new Order({
                  ...defaultParams,
                  options: {
                    ...defaultParams.options,
                    type: OrderOptions.types.STOP_LOSS_LIMIT,
                    side: OrderOptions.sides.SELL,
                    baseQuantity: 100,
                    quoteQuantity: undefined,
                    price: undefined
                  }
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('options.price is required')
            })
          })
        })

        describe('stopPrice', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, stopPrice: 'seventy' } })),
            expect: error => expect(error.data[0].message).to.eql('options.stopPrice must be a number')
          })

          behaviours.throwsValidationError('must be greater than or equal to 0', {
            check: () => (new Order({ ...defaultParams, options: { ...defaultParams.options, stopPrice: -1 } })),
            expect: error => expect(error.data[0].message).to.eql('options.stopPrice must be greater than or equal to 0')
          })

          describe('when type is MARKET', () => {
            it('defaults to underfined', () => {
              const model = new Order({ ...defaultParams, options: { ...defaultParams.options, type: 'MARKET', stopPrice: undefined } })

              expect(model.options.stopPrice).to.undefined()
            })
          })

          describe('when type has STOP_LOSS', () => {
            behaviours.throwsValidationError('is required', {
              check: () => (
                new Order({
                  ...defaultParams,
                  options: {
                    ...defaultParams.options,
                    type: OrderOptions.types.STOP_LOSS_LIMIT,
                    side: OrderOptions.sides.SELL,
                    baseQuantity: 100,
                    quoteQuantity: undefined,
                    stopPrice: undefined
                  }
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('options.stopPrice is required')
            })
          })

          describe('when type has TAKE_PROFIT', () => {
            behaviours.throwsValidationError('is required', {
              check: () => (
                new Order({
                  ...defaultParams,
                  options: {
                    ...defaultParams.options,
                    type: OrderOptions.types.TAKE_PROFIT,
                    side: OrderOptions.sides.SELL,
                    baseQuantity: 100,
                    quoteQuantity: undefined,
                    stopPrice: undefined
                  }
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('options.stopPrice is required')
            })
          })
        })
      })
    })

    describe('exchange', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Order({ ...defaultParams, exchange: undefined })),
        expect: error => expect(error.data[0].message).to.eql('exchange is required')
      })

      behaviours.throwsValidationError('must be a string', {
        check: () => (new Order({ ...defaultParams, exchange: chance.integer() })),
        expect: error => expect(error.data[0].message).to.eql('exchange must be a string')
      })
    })

    describe('market', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Order({ ...defaultParams, market: undefined })),
        expect: error => expect(error.data[0].message).to.eql('market is required')
      })

      behaviours.throwsValidationError('must be a string', {
        check: () => (new Order({ ...defaultParams, market: chance.integer() })),
        expect: error => expect(error.data[0].message).to.eql('market must be a string')
      })
    })

    describe('status', () => {
      behaviours.throwsValidationError('must match', {
        check: () => (new Order({ ...defaultParams, status: chance.string({ max: 5, aplha: true }) })),
        expect: error => expect(error.data[0].message).to.eql(`status must match one of ${Object.values(Order.statuses).join(', ')}`)
      })

      it('defaults to NEW', () => {
        const model = new Order({ ...defaultParams, status: undefined })

        expect(model.status).not.to.be.null()
        expect(model.status).be.eql(Order.statuses.NEW)
      })
    })

    describe('side', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Order({ ...defaultParams, side: undefined })),
        expect: error => expect(error.data[0].message).to.eql('side is required')
      })

      behaviours.throwsValidationError('must match', {
        check: () => (new Order({ ...defaultParams, side: chance.string({ max: 5, aplha: true }) })),
        expect: error => expect(error.data[0].message).to.eql(`side must match one of ${Object.values(OrderOptions.sides).join(', ')}`)
      })
    })

    describe('type', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Order({ ...defaultParams, type: undefined })),
        expect: error => expect(error.data[0].message).to.eql('type is required')
      })

      behaviours.throwsValidationError('must match', {
        check: () => (new Order({ ...defaultParams, type: chance.string({ max: 5, aplha: true }) })),
        expect: error => expect(error.data[0].message).to.eql(`type must match one of ${Object.values(OrderOptions.types).join(', ')}`)
      })

      describe('when side is BUY and type is a STOP', () => {
        behaviours.throwsValidationError('is not supported', {
          check: () => (
            new Order({
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
            new Order({
              ...defaultParams,
              side: OrderOptions.sides.BUY,
              type: OrderOptions.types.TAKE_PROFIT
            })
          ),
          expect: error => expect(error.data[0].message).to.eql('type does not support BUY')
        })
      })
    })

    describe('baseQuantityGross', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Order({ ...defaultParams, baseQuantityGross: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantityGross must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new Order({ ...defaultParams, baseQuantityGross: -1 })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantityGross must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Order({ ...defaultParams, baseQuantityGross: undefined })

        expect(model.baseQuantityGross).not.to.be.null()
        expect(model.baseQuantityGross).be.eql('0')
      })
    })

    describe('baseQuantityNet', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Order({ ...defaultParams, baseQuantityNet: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantityNet must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new Order({ ...defaultParams, baseQuantityNet: -1 })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantityNet must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Order({ ...defaultParams, baseQuantityNet: undefined })

        expect(model.baseQuantityNet).not.to.be.null()
        expect(model.baseQuantityNet).be.eql('0')
      })
    })

    describe('quoteQuantityGross', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Order({ ...defaultParams, quoteQuantityGross: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantityGross must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new Order({ ...defaultParams, quoteQuantityGross: -1 })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantityGross must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Order({ ...defaultParams, quoteQuantityGross: undefined })

        expect(model.quoteQuantityGross).not.to.be.null()
        expect(model.quoteQuantityGross).be.eql('0')
      })
    })

    describe('quoteQuantityNet', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Order({ ...defaultParams, quoteQuantityNet: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantityNet must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new Order({ ...defaultParams, quoteQuantityNet: -1 })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantityNet must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Order({ ...defaultParams, quoteQuantityNet: undefined })

        expect(model.quoteQuantityNet).not.to.be.null()
        expect(model.quoteQuantityNet).be.eql('0')
      })
    })

    describe('price', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Order({ ...defaultParams, price: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('price must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new Order({ ...defaultParams, price: -1 })),
        expect: error => expect(error.data[0].message).to.eql('price must be greater than or equal to 0')
      })

      describe('when type has LIMIT', () => {
        behaviours.throwsValidationError('is required', {
          check: () => (
            new Order({
              ...defaultParams,
              type: OrderOptions.types.STOP_LOSS_LIMIT,
              side: OrderOptions.sides.SELL,
              price: undefined
            })
          ),
          expect: error => expect(error.data[0].message).to.eql('price is required')
        })
      })
    })

    describe('stopPrice', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Order({ ...defaultParams, stopPrice: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('stopPrice must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new Order({ ...defaultParams, stopPrice: -1 })),
        expect: error => expect(error.data[0].message).to.eql('stopPrice must be greater than or equal to 0')
      })

      describe('when type has STOP_LOSS', () => {
        behaviours.throwsValidationError('is required', {
          check: () => (
            new Order({
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
            new Order({
              ...defaultParams,
              ...defaultParams.options,
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

    describe('stopPriceHit', () => {
      behaviours.throwsValidationError('must be a boolean', {
        check: () => (new Order({ ...defaultParams, stopPriceHit: -1 })),
        expect: error => expect(error.data[0].message).to.eql('stopPriceHit must be a boolean')
      })
    })

    describe('averagePrice', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Order({ ...defaultParams, averagePrice: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('averagePrice must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new Order({ ...defaultParams, averagePrice: -1 })),
        expect: error => expect(error.data[0].message).to.eql('averagePrice must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Order({ ...defaultParams, averagePrice: undefined })

        expect(model.averagePrice).not.to.be.null()
        expect(model.averagePrice).be.eql('0')
      })
    })

    describe('trades', () => {
      behaviours.throwsValidationError('must be an array', {
        check: () => (new Order({ ...defaultParams, trades: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('trades must be an array')
      })

      describe('items', () => {
        behaviours.throwsValidationError('must be an instance of Trade', {
          check: () => (new Order({ ...defaultParams, trades: [{}] })),
          expect: error => expect(error.data[0].message).to.eql('trades[0] must be an instance of the Trade class')
        })
      })

      it('defaults to an empty array', () => {
        const model = new Order({ ...defaultParams, trades: undefined })

        expect(model.trades).not.to.be.null()
        expect(model.trades).be.eql([])
      })
    })
  })

  describe('#fromExchangeOrder', () => {
    it('returns an Order from a passed in ExchangeOrder', () => {
      const exchangeOrder = Factory('exchangeOrder').build({
        status: Order.statuses.FILLED,
        side: OrderOptions.types.BUY,
        type: OrderOptions.types.LIMIT,
        price: 10,
        quoteQuantity: 1000,
        averagePrice: '10',
        baseQuantityGross: '100',
        baseQuantityNet: '99.9',
        quoteQuantityGross: '1000',
        quoteQuantityNet: '1000'
      })

      const order = Order.fromExchangeOrder(exchangeOrder, { options: { quoteQuantity: 1000 } })

      expect(order).to.deep.include({
        foreignId: exchangeOrder.id,
        status: exchangeOrder.status,
        type: exchangeOrder.type,
        price: exchangeOrder.price,
        averagePrice: exchangeOrder.averagePrice,
        baseQuantityGross: exchangeOrder.baseQuantityGross,
        baseQuantityNet: exchangeOrder.baseQuantityNet,
        quoteQuantityGross: exchangeOrder.quoteQuantityGross,
        quoteQuantityNet: exchangeOrder.quoteQuantityNet
      })

      expect(order.options).to.deep.include({
        exchange: exchangeOrder.exchange,
        market: exchangeOrder.market,
        side: exchangeOrder.side,
        type: exchangeOrder.type,
        price: exchangeOrder.price,
        quoteQuantity: exchangeOrder.quoteQuantity
      })
    })
  })
})
