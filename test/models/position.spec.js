const _ = require('lodash')

const { expect, Factory, chance, moment, behaviours } = require('../helpers')

const { Position, Order, OrderOptions } = require('../../lib/models')

describe('Position Model', () => {
  it('has types', () => {
    expect(Position.types).to.eql({ LONG: 'LONG' })
  })

  it('has statuses', () => {
    expect(Position.statuses).to.eql({ NEW: 'NEW', OPEN: 'OPEN', CLOSING: 'CLOSING', CLOSED: 'CLOSED' })
  })

  describe('params', () => {
    let defaultParams

    beforeEach(() => {
      defaultParams = _.cloneDeep({
        id: chance.guid({ version: 4 }),
        timestamp: chance.date(),
        exchange: 'binance',
        market: 'BTC/USDT',
        status: chance.pickone(Object.values(Position.statuses)),
        type: chance.pickone(Object.values(Position.types)),
        entries: [{
          exchange: 'binance',
          market: 'BTC/USDT',
          type: OrderOptions.types.LIMIT,
          price: chance.integer({ min: 1, max: 100 }),
          quoteQuantity: 1000.00
        }],
        exits: [
          {
            exchange: 'binance',
            market: 'BTC/USDT',
            type: OrderOptions.types.STOP_LOSS_LIMIT,
            price: chance.integer({ min: 1, max: 100 }),
            stopPrice: chance.integer({ min: 1, max: 100 }),
            baseQuantity: 10
          },
          {
            exchange: 'binance',
            market: 'BTC/USDT',
            type: OrderOptions.types.TAKE_PROFIT_LIMIT,
            price: chance.integer({ min: 1, max: 100 }),
            stopPrice: chance.integer({ min: 1, max: 100 }),
            baseQuantity: 10
          }
        ],
        win: chance.bool(),
        realizedPnL: chance.integer({ min: 0, max: 1000 }),
        realizedPnLPercent: chance.floating({ min: 0, max: 100 }),
        unrealizedPnL: chance.integer({ min: 0, max: 1000 }),
        unrealizedPnLPercent: chance.floating({ min: 0, max: 100 }),
        pnl: chance.integer({ min: 0, max: 1000 }),
        pnlPercent: chance.floating({ min: 1, max: 100 }),
        orders: []
      })
    })

    describe('id', () => {
      behaviours.throwsValidationError('must be a UUID', {
        check: () => (new Position({ ...defaultParams, id: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('id must be a valid UUID')
      })

      it('defaults to a UUID', () => {
        const model = new Position({ ...defaultParams, id: undefined })

        expect(model.id).be.a.uuid('v4')
      })
    })

    describe('signalId', () => {
      behaviours.throwsValidationError('must be a UUID', {
        check: () => (new Position({ ...defaultParams, signalId: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('signalId must be a valid UUID')
      })
    })

    describe('timestamp', () => {
      behaviours.throwsValidationError('must be a date', {
        check: () => (new Position({ ...defaultParams, timestamp: 'tomorrow' })),
        expect: error => expect(error.data[0].message).to.eql('timestamp must be a Date')
      })

      it('defaults to current time', () => {
        const model = new Position({ ...defaultParams, timestamp: undefined })

        expect(model.timestamp).not.to.be.null()
        expect(model.timestamp).be.closeToTime(new Date(), 1)
      })
    })

    describe('exchange', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Position({ ...defaultParams, exchange: undefined })),
        expect: error => expect(error.data[0].message).to.eql('exchange is required')
      })

      behaviours.throwsValidationError('must be a string', {
        check: () => (new Position({ ...defaultParams, exchange: chance.integer() })),
        expect: error => expect(error.data[0].message).to.eql('exchange must be a string')
      })
    })

    describe('market', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Position({ ...defaultParams, market: undefined })),
        expect: error => expect(error.data[0].message).to.eql('market is required')
      })

      behaviours.throwsValidationError('must be a string', {
        check: () => (new Position({ ...defaultParams, market: chance.integer() })),
        expect: error => expect(error.data[0].message).to.eql('market must be a string')
      })
    })

    describe('status', () => {
      behaviours.throwsValidationError('must match', {
        check: () => (new Position({ ...defaultParams, status: chance.string({ max: 5, aplha: true }) })),
        expect: error => expect(error.data[0].message).to.eql(`status must match one of ${Object.values(Position.statuses).join(', ')}`)
      })

      it('defaults to NEW', () => {
        const model = new Position({ ...defaultParams, status: undefined })

        expect(model.status).not.to.be.null()
        expect(model.status).be.eql(Order.statuses.NEW)
      })
    })

    describe('type', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Position({ ...defaultParams, type: undefined })),
        expect: error => expect(error.data[0].message).to.eql('type is required')
      })

      behaviours.throwsValidationError('must match', {
        check: () => (new Position({ ...defaultParams, type: chance.string({ max: 5, aplha: true }) })),
        expect: error => expect(error.data[0].message).to.eql(`type must match one of ${Object.values(Position.types).join(', ')}`)
      })
    })

    describe('entries', () => {
      describe('items', () => {
        behaviours.throwsValidationError('must be an object', {
          check: () => (new Position({ ...defaultParams, entries: [chance.string()] })),
          expect: error => expect(error.data[0].message).to.eql('entries[0] must be an Object')
        })
      })

      it('defaults to an empty array', () => {
        const position = new Position({ ...defaultParams, entries: undefined })

        expect(position.entries).to.eql([])
      })

      describe('props', () => {
        describe('exchange', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (new Position({ ...defaultParams, entries: [{ ...defaultParams.entries[0], exchange: undefined }] })),
            expect: error => expect(error.data[0].message).to.eql('entries[0].exchange is required')
          })

          behaviours.throwsValidationError('must be a string', {
            check: () => (new Position({ ...defaultParams, entries: [{ ...defaultParams.entries[0], exchange: chance.integer() }] })),
            expect: error => expect(error.data[0].message).to.eql('entries[0].exchange must be a string')
          })
        })

        describe('market', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (new Position({ ...defaultParams, entries: [{ ...defaultParams.entries[0], market: undefined }] })),
            expect: error => expect(error.data[0].message).to.eql('entries[0].market is required')
          })

          behaviours.throwsValidationError('must be a string', {
            check: () => (new Position({ ...defaultParams, entries: [{ ...defaultParams.entries[0], market: chance.integer() }] })),
            expect: error => expect(error.data[0].message).to.eql('entries[0].market must be a string')
          })
        })

        describe('type', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (new Position({ ...defaultParams, entries: [{ ...defaultParams.entries[0], type: undefined }] })),
            expect: error => expect(error.data[0].message).to.eql('entries[0].type is required')
          })

          behaviours.throwsValidationError('must match', {
            check: () => (new Position({ ...defaultParams, entries: [{ ...defaultParams.entries[0], type: chance.string({ max: 5, aplha: true }) }] })),
            expect: error => expect(error.data[0].message).to.eql(`entries[0].type must match one of ${Object.values(OrderOptions.types).join(', ')}`)
          })

          describe('when side is BUY and type is a STOP', () => {
            behaviours.throwsValidationError('is not supported', {
              check: () => (
                new Position({
                  ...defaultParams,
                  entries: [{
                    ...defaultParams.entries[0],
                    side: OrderOptions.sides.BUY,
                    type: OrderOptions.types.STOP_LOSS_LIMIT
                  }]
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('entries[0].type does not support BUY')
            })
          })

          describe('when side is BUY and type is a TAKE PROFIT', () => {
            behaviours.throwsValidationError('is not supported', {
              check: () => (
                new Position({
                  ...defaultParams,
                  entries: [{
                    ...defaultParams.entries[0],
                    side: OrderOptions.sides.BUY,
                    type: OrderOptions.types.TAKE_PROFIT
                  }]
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('entries[0].type does not support BUY')
            })
          })
        })

        describe('baseQuantity', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Position({ ...defaultParams, entries: [{ ...defaultParams.entries[0], baseQuantity: 'seventy' }] })),
            expect: error => expect(error.data[0].message).to.eql('entries[0].baseQuantity must be a number')
          })

          behaviours.throwsValidationError('must be greater than or equal to 0', {
            check: () => (new Position({ ...defaultParams, entries: [{ ...defaultParams.entries[0], baseQuantity: -1 }] })),
            expect: error => expect(error.data[0].message).to.eql('entries[0].baseQuantity must be greater than or equal to 0')
          })

          describe('when type is MARKET', () => {
            describe('and neither baseQuantity or quoteQuantity are provided', () => {
              behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                check: () => (
                  new Position({
                    ...defaultParams,
                    entries: [{
                      ...defaultParams.entries[0],
                      type: OrderOptions.types.MARKET,
                      baseQuantity: undefined,
                      quoteQuantity: undefined
                    }]
                  })
                ),
                expect: error => expect(error.data[0].message).to.eql('entries[0].baseQuantity or entries[0].quoteQuantity is required')
              })
            })

            describe('and both baseQuantity and quoteQuantity are provided', () => {
              behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                check: () => (
                  new Position({
                    ...defaultParams,
                    entries: [{
                      ...defaultParams.entries[0],
                      type: OrderOptions.types.MARKET,
                      baseQuantity: 100,
                      quoteQuantity: 100
                    }]
                  })
                ),
                expect: error => expect(error.data[0].message).to.eql('entries[0].baseQuantity or entries[0].quoteQuantity is required')
              })
            })
          })

          describe('when type is LIMIT', () => {
            describe('and neither baseQuantity or quoteQuantity are provided', () => {
              behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                check: () => (
                  new Position({
                    ...defaultParams,
                    entries: [{
                      ...defaultParams.entries[0],
                      type: OrderOptions.types.LIMIT,
                      side: OrderOptions.sides.BUY,
                      baseQuantity: undefined,
                      quoteQuantity: undefined
                    }]
                  })
                ),
                expect: error => expect(error.data[0].message).to.eql('entries[0].baseQuantity or entries[0].quoteQuantity is required')
              })
            })

            describe('and both baseQuantity and quoteQuantity are provided', () => {
              behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                check: () => (
                  new Position({
                    ...defaultParams,
                    entries: [{
                      ...defaultParams.entries[0],
                      type: OrderOptions.types.LIMIT,
                      side: OrderOptions.sides.SELL,
                      baseQuantity: 100,
                      quoteQuantity: 100
                    }]
                  })
                ),
                expect: error => expect(error.data[0].message).to.eql('entries[0].baseQuantity or entries[0].quoteQuantity is required')
              })
            })
          })

          describe('when type is not MARKET or LIMIT', () => {
            behaviours.throwsValidationError('is required', {
              check: () => (
                new Position({
                  ...defaultParams,
                  entries: [{
                    ...defaultParams.entries[0],
                    type: OrderOptions.types.STOP_LOSS_LIMIT,
                    side: OrderOptions.sides.SELL,
                    baseQuantity: undefined,
                    quoteQuantity: undefined
                  }]
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('entries[0].baseQuantity is required')
            })
          })
        })

        describe('quoteQuantity', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Position({ ...defaultParams, entries: [{ ...defaultParams.entries[0], quoteQuantity: 'seventy' }] })),
            expect: error => expect(error.data[0].message).to.eql('entries[0].quoteQuantity must be a number')
          })

          behaviours.throwsValidationError('must be greater than or equal to 0', {
            check: () => (new Position({ ...defaultParams, entries: [{ ...defaultParams.entries[0], quoteQuantity: -1 }] })),
            expect: error => expect(error.data[0].message).to.eql('entries[0].quoteQuantity must be greater than or equal to 0')
          })
        })

        describe('price', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Position({ ...defaultParams, entries: [{ ...defaultParams.entries[0], price: 'seventy' }] })),
            expect: error => expect(error.data[0].message).to.eql('entries[0].price must be a number')
          })

          behaviours.throwsValidationError('must be greater than or equal to 0', {
            check: () => (new Position({ ...defaultParams, entries: [{ ...defaultParams.entries[0], price: -1 }] })),
            expect: error => expect(error.data[0].message).to.eql('entries[0].price must be greater than or equal to 0')
          })

          describe('when type has LIMIT', () => {
            behaviours.throwsValidationError('is required', {
              check: () => (
                new Position({
                  ...defaultParams,
                  entries: [{
                    ...defaultParams.entries[0],
                    type: OrderOptions.types.STOP_LOSS_LIMIT,
                    side: OrderOptions.sides.SELL,
                    baseQuantity: 100,
                    quoteQuantity: undefined,
                    price: undefined
                  }]
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('entries[0].price is required')
            })
          })
        })
      })
    })

    describe('exits', () => {
      behaviours.throwsValidationError('must be an array', {
        check: () => (new Position({ ...defaultParams, exits: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('exits[0] must be an Object')
      })

      describe('items', () => {
        behaviours.throwsValidationError('must be an object', {
          check: () => (new Position({ ...defaultParams, exits: [chance.string()] })),
          expect: error => expect(error.data[0].message).to.eql('exits[0] must be an Object')
        })
      })

      it('defaults to an empty array', () => {
        const position = new Position({ ...defaultParams, exits: undefined })

        expect(position.exits).to.eql([])
      })

      describe('props', () => {
        describe('exchange', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (new Position({ ...defaultParams, exits: [{ ...defaultParams.exits[0], exchange: undefined }] })),
            expect: error => expect(error.data[0].message).to.eql('exits[0].exchange is required')
          })

          behaviours.throwsValidationError('must be a string', {
            check: () => (new Position({ ...defaultParams, exits: [{ ...defaultParams.exits[0], exchange: chance.integer() }] })),
            expect: error => expect(error.data[0].message).to.eql('exits[0].exchange must be a string')
          })
        })

        describe('market', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (new Position({ ...defaultParams, exits: [{ ...defaultParams.exits[0], market: undefined }] })),
            expect: error => expect(error.data[0].message).to.eql('exits[0].market is required')
          })

          behaviours.throwsValidationError('must be a string', {
            check: () => (new Position({ ...defaultParams, exits: [{ ...defaultParams.exits[0], market: chance.integer() }] })),
            expect: error => expect(error.data[0].message).to.eql('exits[0].market must be a string')
          })
        })

        describe('type', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (new Position({ ...defaultParams, exits: [{ ...defaultParams.exits[0], type: undefined }] })),
            expect: error => expect(error.data[0].message).to.eql('exits[0].type is required')
          })

          behaviours.throwsValidationError('must match', {
            check: () => (new Position({ ...defaultParams, exits: [{ ...defaultParams.exits[0], type: chance.string({ max: 5, aplha: true }) }] })),
            expect: error => expect(error.data[0].message).to.eql(`exits[0].type must match one of ${Object.values(OrderOptions.types).join(', ')}`)
          })

          describe('when side is BUY and type is a STOP', () => {
            behaviours.throwsValidationError('is not supported', {
              check: () => (
                new Position({
                  ...defaultParams,
                  exits: [{
                    ...defaultParams.exits[0],
                    side: OrderOptions.sides.BUY,
                    type: OrderOptions.types.STOP_LOSS_LIMIT
                  }]
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('exits[0].type does not support BUY')
            })
          })

          describe('when side is BUY and type is a TAKE PROFIT', () => {
            behaviours.throwsValidationError('is not supported', {
              check: () => (
                new Position({
                  ...defaultParams,
                  exits: [{
                    ...defaultParams.exits[0],
                    side: OrderOptions.sides.BUY,
                    type: OrderOptions.types.TAKE_PROFIT
                  }]
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('exits[0].type does not support BUY')
            })
          })
        })

        describe('baseQuantity', () => {
          describe('when type is MARKET', () => {
            describe('and neither baseQuantity or quoteQuantity are provided', () => {
              behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                check: () => (
                  new Position({
                    ...defaultParams,
                    exits: [{
                      ...defaultParams.exits[0],
                      type: OrderOptions.types.MARKET,
                      baseQuantity: undefined,
                      quoteQuantity: undefined
                    }]
                  })
                ),
                expect: error => expect(error.data[0].message).to.eql('exits[0].baseQuantity or exits[0].quoteQuantity is required')
              })
            })

            describe('and both baseQuantity and quoteQuantity are provided', () => {
              behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                check: () => (
                  new Position({
                    ...defaultParams,
                    exits: [{
                      ...defaultParams.exits[0],
                      type: OrderOptions.types.MARKET,
                      baseQuantity: 100,
                      quoteQuantity: 100
                    }]
                  })
                ),
                expect: error => expect(error.data[0].message).to.eql('exits[0].baseQuantity or exits[0].quoteQuantity is required')
              })
            })
          })

          describe('when type is LIMIT', () => {
            describe('and neither baseQuantity or quoteQuantity are provided', () => {
              behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                check: () => (
                  new Position({
                    ...defaultParams,
                    exits: [{
                      ...defaultParams.exits[0],
                      type: OrderOptions.types.LIMIT,
                      side: OrderOptions.sides.BUY,
                      baseQuantity: undefined,
                      quoteQuantity: undefined
                    }]
                  })
                ),
                expect: error => expect(error.data[0].message).to.eql('exits[0].baseQuantity or exits[0].quoteQuantity is required')
              })
            })

            describe('and both baseQuantity and quoteQuantity are provided', () => {
              behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                check: () => (
                  new Position({
                    ...defaultParams,
                    exits: [{
                      ...defaultParams.exits[0],
                      type: OrderOptions.types.LIMIT,
                      side: OrderOptions.sides.SELL,
                      baseQuantity: 100,
                      quoteQuantity: 100
                    }]
                  })
                ),
                expect: error => expect(error.data[0].message).to.eql('exits[0].baseQuantity or exits[0].quoteQuantity is required')
              })
            })
          })

          describe('when type is not MARKET or LIMIT', () => {
            behaviours.throwsValidationError('is required', {
              check: () => (
                new Position({
                  ...defaultParams,
                  exits: [{
                    ...defaultParams.exits[0],
                    type: OrderOptions.types.STOP_LOSS_LIMIT,
                    side: OrderOptions.sides.SELL,
                    baseQuantity: undefined,
                    quoteQuantity: undefined
                  }]
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('exits[0].baseQuantity is required')
            })
          })
        })

        describe('price', () => {
          describe('when type has LIMIT', () => {
            behaviours.throwsValidationError('is required', {
              check: () => (
                new Position({
                  ...defaultParams,
                  exits: [{
                    ...defaultParams.exits[0],
                    type: OrderOptions.types.STOP_LOSS_LIMIT,
                    side: OrderOptions.sides.SELL,
                    baseQuantity: 100,
                    quoteQuantity: undefined,
                    price: undefined
                  }]
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('exits[0].price is required')
            })
          })
        })

        describe('stopPrice', () => {
          describe('when type is MARKET', () => {
            it('defaults to underfined', () => {
              const model = new Position({ ...defaultParams, exit: { ...defaultParams.exits[0], type: 'MARKET', stopPrice: undefined } })

              expect(model.exit.stopPrice).to.undefined()
            })
          })

          describe('when type has STOP_LOSS', () => {
            behaviours.throwsValidationError('is required', {
              check: () => (
                new Position({
                  ...defaultParams,
                  exits: [{
                    ...defaultParams.exits[0],
                    type: OrderOptions.types.STOP_LOSS_LIMIT,
                    side: OrderOptions.sides.SELL,
                    baseQuantity: 100,
                    quoteQuantity: undefined,
                    stopPrice: undefined
                  }]
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('exits[0].stopPrice is required')
            })
          })

          describe('when type has TAKE_PROFIT', () => {
            behaviours.throwsValidationError('is required', {
              check: () => (
                new Position({
                  ...defaultParams,
                  exits: [{
                    ...defaultParams.exits[0],
                    type: OrderOptions.types.TAKE_PROFIT,
                    side: OrderOptions.sides.SELL,
                    baseQuantity: 100,
                    quoteQuantity: undefined,
                    stopPrice: undefined
                  }]
                })
              ),
              expect: error => expect(error.data[0].message).to.eql('exits[0].stopPrice is required')
            })
          })
        })
      })
    })

    describe('win', () => {
      behaviours.throwsValidationError('must be a boolean', {
        check: () => (new Position({ ...defaultParams, win: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('win must be a boolean')
      })

      it('defaults to null', () => {
        const model = new Position({ ...defaultParams, win: undefined })

        expect(model.win).to.be.null()
      })
    })

    describe('realizedPnL', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Position({ ...defaultParams, realizedPnL: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('realizedPnL must be a number')
      })

      it('defaults to 0', () => {
        const model = new Position({ ...defaultParams, realizedPnL: undefined })

        expect(model.realizedPnL).not.to.be.null()
        expect(model.realizedPnL).be.eql('0')
      })
    })

    describe('realizedPnLPercent', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Position({ ...defaultParams, realizedPnLPercent: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('realizedPnLPercent must be a number')
      })

      it('defaults to 0', () => {
        const model = new Position({ ...defaultParams, realizedPnLPercent: undefined })

        expect(model.realizedPnLPercent).not.to.be.null()
        expect(model.realizedPnLPercent).be.eql('0')
      })
    })

    describe('unrealizedPnL', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Position({ ...defaultParams, unrealizedPnL: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('unrealizedPnL must be a number')
      })

      it('defaults to 0', () => {
        const model = new Position({ ...defaultParams, unrealizedPnL: undefined })

        expect(model.unrealizedPnL).not.to.be.null()
        expect(model.unrealizedPnL).be.eql('0')
      })
    })

    describe('unrealizedPnLPercent', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Position({ ...defaultParams, unrealizedPnLPercent: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('unrealizedPnLPercent must be a number')
      })

      it('defaults to 0', () => {
        const model = new Position({ ...defaultParams, unrealizedPnLPercent: undefined })

        expect(model.unrealizedPnLPercent).not.to.be.null()
        expect(model.unrealizedPnLPercent).be.eql('0')
      })
    })

    describe('pnl', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Position({ ...defaultParams, pnl: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('pnl must be a number')
      })

      it('defaults to 0', () => {
        const model = new Position({ ...defaultParams, pnl: undefined })

        expect(model.pnl).not.to.be.null()
        expect(model.pnl).be.eql('0')
      })
    })

    describe('pnlPercent', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Position({ ...defaultParams, pnlPercent: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('pnlPercent must be a number')
      })

      it('defaults to 0', () => {
        const model = new Position({ ...defaultParams, pnlPercent: undefined })

        expect(model.pnlPercent).not.to.be.null()
        expect(model.pnlPercent).be.eql('0')
      })
    })

    describe('orders', () => {
      behaviours.throwsValidationError('must be an array', {
        check: () => (new Position({ ...defaultParams, orders: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('orders must be an array')
      })

      describe('items', () => {
        behaviours.throwsValidationError('must be an instance of Order class', {
          check: () => (new Position({ ...defaultParams, orders: [{ side: 'BUY' }] })),
          expect: error => expect(error.data[0].message).to.eql('orders[0] must be an instance of the Order class')
        })
      })

      it('defaults to an empty array', () => {
        const model = new Position({ ...defaultParams, orders: undefined })

        expect(model.orders).not.to.be.null()
        expect(model.orders).be.eql([])
      })
    })

    describe('statistics', () => {
      behaviours.throwsValidationError('must be an Object', {
        check: () => (new Position({ ...defaultParams, statistics: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('statistics must be an Object')
      })

      it('defaults to an empty Object', () => {
        const model = new Position({ ...defaultParams, statistics: undefined })

        expect(model.orders).not.to.be.null()
        expect(model.statistics).be.eql({})
      })

      describe('props', () => {
        describe('duration', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Position({ ...defaultParams, statistics: { duration: chance.string() } })),
            expect: error => expect(error.data[0].message).to.eql('statistics.duration must be a number')
          })
        })
      })
    })

    describe('createdAt', () => {
      behaviours.throwsValidationError('must be a date', {
        check: () => (new Position({ ...defaultParams, createdAt: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('createdAt must be a Date')
      })

      it('defaults to the current time', () => {
        const model = new Position({ ...defaultParams, createdAt: undefined })

        expect(model.createdAt).not.to.be.null()
        expect(model.createdAt).be.closeToTime(new Date(), 1000)
      })
    })

    describe('closedAt', () => {
      behaviours.throwsValidationError('must be a date', {
        check: () => (new Position({ ...defaultParams, closedAt: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('closedAt must be a Date')
      })

      describe('when status is CLOSED', () => {
        describe('and closedAt is not yet set', () => {
          it('sets closedAt to the current time', () => {
            const model = new Position({ ...defaultParams, status: Position.statuses.CLOSED })

            expect(model.closedAt).not.to.be.null()
            expect(model.closedAt).be.closeToTime(new Date(), 1000)
          })
        })

        describe('and closedAt is already set', () => {
          it('does not change closedAt', () => {
            const date = chance.date()
            const model = new Position({ ...defaultParams, status: Position.statuses.CLOSED, closedAt: date })

            expect(model.closedAt).not.to.be.null()
            expect(model.closedAt).be.eql(date)
          })
        })
      })
    })
  })

  describe('#set', () => {
    describe('when position has createdAt and updatedAt', () => {
      it('sets duration in statistics as milliseconds between timestamp and closedAt', () => {
        const position = Factory('position').build({
          timestamp: moment.utc().subtract(1, 'week').toDate()
        })

        expect(position.statistics.duration).to.be.undefined()

        position.set({ status: Position.statuses.CLOSED, closedAt: moment.utc().toDate() })

        const expected = moment.duration(moment(position.closedAt).diff(position.timestamp))

        expect(position.statistics.duration).to.be.eql(expected.asMilliseconds())
      })
    })
  })

  describe('#findFilledEntryOrders', () => {
    describe('when type is LONG', () => {
      it('returns all BUY orders that have been filled', () => {
        const position = Factory('position').build({ type: Position.types.LONG })

        const buyOrder = Factory('exchangeOrder').build({
          type: OrderOptions.types.MARKET,
          side: OrderOptions.sides.BUY,
          status: Order.statuses.FILLED,
          baseQuantity: 100,
          quoteQuantity: undefined
        })

        const sellOrder = Factory('exchangeOrder').build({
          side: OrderOptions.sides.SELL,
          status: Order.statuses.FILLED,
          baseQuantity: 100,
          quoteQuantity: undefined
        })

        const orders = [
          Factory('orderFromExchangeOrder').build(buyOrder),
          Factory('orderFromExchangeOrder').build(sellOrder)
        ]

        position.set({ orders })

        const filledEntryOrders = position.findFilledEntryOrders()

        expect(filledEntryOrders).to.eql([orders[0]])
      })
    })
  })

  describe('#findFilledExitOrders', () => {
    describe('when type is LONG', () => {
      it('returns all SELL orders that have been filled', () => {
        const position = Factory('position').build({ type: Position.types.LONG })
        const buyOrder = Factory('exchangeOrder').build({ side: OrderOptions.sides.BUY, status: Order.statuses.FILLED, baseQuantity: 100 })
        const sellOrder = Factory('exchangeOrder').build({ side: OrderOptions.sides.SELL, status: Order.statuses.FILLED, baseQuantity: 100 })
        const orders = [
          Factory('orderFromExchangeOrder').build(buyOrder),
          Factory('orderFromExchangeOrder').build(sellOrder)
        ]

        position.set({ orders })

        const filledExitOrders = position.findFilledExitOrders()

        expect(filledExitOrders).to.eql([orders[1]])
      })
    })
  })
})
