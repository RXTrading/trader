const { expect, chance, behaviours } = require('../helpers')

const Signal = require('../../lib/models/signal')
const Position = require('../../lib/models/position')
const OrderOptions = require('../../lib/models/orderOptions')

describe('Signal Model', () => {
  it('has statuses', () => {
    expect(Signal.statuses).to.eql({
      NEW: 'NEW',
      PROCESSING: 'PROCESSING',
      ACCEPTED: 'ACCEPTED',
      REJECTED: 'REJECTED',
      EXPIRED: 'EXPIRED'
    })
  })

  it('has types', () => {
    expect(Signal.types).to.eql({
      OPEN_POSITION: 'OPEN_POSITION',
      CLOSE_POSITION: 'CLOSE_POSITION',
      CLOSE_ALL_POSITIONS: 'CLOSE_ALL_POSITIONS'
    })
  })

  describe('params', () => {
    const defaultParams = {
      id: chance.guid({ version: 4 }),
      timestamp: chance.date(),
      status: chance.pickone(Object.values(Signal.statuses)),
      type: Signal.types.OPEN_POSITION,
      params: {
        type: Position.types.LONG,
        entries: {
          exchange: 'binance',
          market: 'BTC/USDT',
          type: OrderOptions.types.LIMIT,
          baseQuantity: 100,
          price: 10000
        },
        exits: [
          {
            exchange: 'binance',
            market: 'BTC/USDT',
            type: OrderOptions.types.STOP_LOSS_LIMIT,
            baseQuantity: 9.9,
            price: 9500,
            stopPrice: 9600
          },
          {
            exchange: 'binance',
            market: 'BTC/USDT',
            type: OrderOptions.types.TAKE_PROFIT_LIMIT,
            baseQuantity: 9.9,
            price: 11000,
            stopPrice: 10900
          }
        ]
      },
      rule: {}
    }

    describe('id', () => {
      it('must be a UUID', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, id: 'random-id' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('id must be a valid UUID')
      })

      it('defaults to a UUID', () => {
        const model = new Signal({ ...defaultParams, id: undefined })

        expect(model.id).be.a.uuid('v4')
      })
    })

    describe('timestamp', () => {
      it('must be a date', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, timestamp: 'tomorrow' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('timestamp must be a Date')
      })

      it('defaults to current time', () => {
        const model = new Signal({ ...defaultParams, timestamp: undefined })

        expect(model.timestamp).not.to.be.null()
        expect(model.timestamp).be.closeToTime(new Date(), 1)
      })
    })

    describe('type', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, type: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('type is required')
      })

      it('must match', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, type: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql(
          `type must match one of ${Object.values(Signal.types).join(', ')}`
        )
      })
    })

    describe('status', () => {
      it('must match', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, status: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql(
          `status must match one of ${Object.values(Signal.statuses).join(', ')}`
        )
      })

      it('defaults to NEW', () => {
        const model = new Signal({ ...defaultParams, status: undefined })

        expect(model.status).not.to.be.null()
        expect(model.status).be.eql(Signal.statuses.NEW)
      })
    })

    describe('params', () => {
      it('must be an object', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, params: chance.integer() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('params must be an Object')
      })

      describe('props', () => {
        describe('when type is OPEN_POSITION', () => {
          describe('type', () => {
            behaviours.throwsValidationError('is required', {
              check: () => (new Signal({ ...defaultParams, params: { ...defaultParams.params, type: undefined } })),
              expect: error => expect(error.data[0].message).to.eql('params.type is required')
            })

            behaviours.throwsValidationError('must match', {
              check: () => (new Signal({ ...defaultParams, params: { ...defaultParams.params, type: chance.string() } })),
              expect: error => expect(error.data[0].message).to.eql(`params.type must match one of ${Object.values(Position.types).join(', ')}`)
            })
          })

          describe('entries', () => {
            behaviours.throwsValidationError('is required', {
              check: () => (new Signal({ ...defaultParams, params: { ...defaultParams.params, entries: undefined } })),
              expect: error => expect(error.data[0].message).to.eql('params.entries is required')
            })

            describe('props', () => {
              describe('exchange', () => {
                behaviours.throwsValidationError('is required', {
                  check: () => (
                    new Signal({
                      ...defaultParams,
                      params: { ...defaultParams.params, entries: { ...defaultParams.params.entries, exchange: undefined } }
                    })
                  ),
                  expect: error => expect(error.data[0].message).to.eql('params.entries[0].exchange is required')
                })
              })

              describe('market', () => {
                behaviours.throwsValidationError('is required', {
                  check: () => (
                    new Signal({
                      ...defaultParams,
                      params: { ...defaultParams.params, entries: { ...defaultParams.params.entries, market: undefined } }
                    })
                  ),
                  expect: error => expect(error.data[0].message).to.eql('params.entries[0].market is required')
                })
              })

              describe('type', () => {
                behaviours.throwsValidationError('is required', {
                  check: () => (
                    new Signal({
                      ...defaultParams,
                      params: { ...defaultParams.params, entries: { ...defaultParams.params.entries, type: undefined } }
                    })
                  ),
                  expect: error => expect(error.data[0].message).to.eql('params.entries[0].type is required')
                })

                behaviours.throwsValidationError('must match', {
                  check: () => (
                    new Signal({
                      ...defaultParams,
                      params: { ...defaultParams.params, entries: { ...defaultParams.params.entries, type: chance.string() } }
                    })
                  ),
                  expect: error => expect(error.data[0].message).to.eql(`params.entries[0].type must match one of ${Object.values(OrderOptions.types).join(', ')}`)
                })

                describe('when side is BUY and type is a STOP', () => {
                  behaviours.throwsValidationError('is not supported', {
                    check: () => (
                      new Signal({
                        ...defaultParams,
                        params: {
                          ...defaultParams.params,
                          entries: {
                            ...defaultParams.params.entries,
                            side: OrderOptions.sides.BUY,
                            type: OrderOptions.types.STOP_LOSS_LIMIT
                          }
                        }
                      })
                    ),
                    expect: error => expect(error.data[0].message).to.eql('params.entries[0].type does not support BUY')
                  })
                })

                describe('when side is BUY and type is a TAKE PROFIT', () => {
                  behaviours.throwsValidationError('is not supported', {
                    check: () => (
                      new Signal({
                        ...defaultParams,
                        params: {
                          ...defaultParams.params,
                          entries: {
                            ...defaultParams.params.entries,
                            side: OrderOptions.sides.BUY,
                            type: OrderOptions.types.TAKE_PROFIT_LIMIT
                          }
                        }
                      })
                    ),
                    expect: error => expect(error.data[0].message).to.eql('params.entries[0].type does not support BUY')
                  })
                })
              })

              describe('baseQuantity', () => {
                describe('when type is MARKET', () => {
                  describe('and neither baseQuantity or quoteQuantity are provided', () => {
                    behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                      check: () => (
                        new Signal({
                          ...defaultParams,
                          params: {
                            ...defaultParams.params,
                            entries: {
                              ...defaultParams.params.entries,
                              type: OrderOptions.types.MARKET,
                              baseQuantity: undefined,
                              quoteQuantity: undefined
                            }
                          }
                        })
                      ),
                      expect: error => expect(error.data[0].message).to.eql('params.entries[0].baseQuantity or params.entries[0].quoteQuantity is required')
                    })
                  })

                  describe('and both baseQuantity and quoteQuantity are provided', () => {
                    behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                      check: () => (
                        new Signal({
                          ...defaultParams,
                          params: {
                            ...defaultParams.params,
                            entries: {
                              ...defaultParams.params.entries,
                              type: OrderOptions.types.MARKET,
                              baseQuantity: 100,
                              quoteQuantity: 100
                            }
                          }
                        })
                      ),
                      expect: error => expect(error.data[0].message).to.eql('params.entries[0].baseQuantity or params.entries[0].quoteQuantity is required')
                    })
                  })
                })

                describe('when type is LIMIT', () => {
                  describe('and neither baseQuantity or quoteQuantity are provided', () => {
                    behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                      check: () => (
                        new Signal({
                          ...defaultParams,
                          params: {
                            ...defaultParams.params,
                            entries: {
                              ...defaultParams.params.entries,
                              type: OrderOptions.types.LIMIT,
                              side: OrderOptions.sides.BUY,
                              baseQuantity: undefined,
                              quoteQuantity: undefined
                            }
                          }
                        })
                      ),
                      expect: error => expect(error.data[0].message).to.eql('params.entries[0].baseQuantity or params.entries[0].quoteQuantity is required')
                    })
                  })

                  describe('and both baseQuantity and quoteQuantity are provided', () => {
                    behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                      check: () => (
                        new Signal({
                          ...defaultParams,
                          params: {
                            ...defaultParams.params,
                            entries: {
                              ...defaultParams.params.entries,
                              type: OrderOptions.types.LIMIT,
                              side: OrderOptions.sides.SELL,
                              baseQuantity: 100,
                              quoteQuantity: 100
                            }
                          }
                        })
                      ),
                      expect: error => expect(error.data[0].message).to.eql('params.entries[0].baseQuantity or params.entries[0].quoteQuantity is required')
                    })
                  })
                })

                describe('when type is not MARKET or LIMIT', () => {
                  behaviours.throwsValidationError('is required', {
                    check: () => (
                      new Signal({
                        ...defaultParams,
                        params: {
                          ...defaultParams.params,
                          entries: {
                            ...defaultParams.params.entries,
                            type: OrderOptions.types.STOP_LOSS_LIMIT,
                            baseQuantity: undefined,
                            quoteQuantity: undefined
                          }
                        }
                      })
                    ),
                    expect: error => expect(error.data[0].message).to.eql('params.entries[0].baseQuantity is required')
                  })
                })
              })

              describe('price', () => {
                describe('when type has LIMIT', () => {
                  behaviours.throwsValidationError('is required', {
                    check: () => (
                      new Signal({
                        ...defaultParams,
                        params: {
                          ...defaultParams.params,
                          entries: {
                            ...defaultParams.params.entries,
                            type: OrderOptions.types.STOP_LOSS_LIMIT,
                            baseQuantity: 100,
                            quoteQuantity: undefined,
                            price: undefined
                          }
                        }
                      })
                    ),
                    expect: error => expect(error.data[0].message).to.eql('params.entries[0].price is required')
                  })
                })
              })
            })
          })

          describe('exits', () => {
            describe('props', () => {
              describe('exchange', () => {
                behaviours.throwsValidationError('is required', {
                  check: () => (
                    new Signal({
                      ...defaultParams,
                      params: { ...defaultParams.params, exits: [{ ...defaultParams.params.exits[0], exchange: undefined }] }
                    })
                  ),
                  expect: error => expect(error.data[0].message).to.eql('params.exits[0].exchange is required')
                })
              })

              describe('market', () => {
                behaviours.throwsValidationError('is required', {
                  check: () => (
                    new Signal({
                      ...defaultParams,
                      params: { ...defaultParams.params, exits: [{ ...defaultParams.params.exits[0], market: undefined }] }
                    })
                  ),
                  expect: error => expect(error.data[0].message).to.eql('params.exits[0].market is required')
                })
              })

              describe('type', () => {
                behaviours.throwsValidationError('is required', {
                  check: () => (
                    new Signal({
                      ...defaultParams,
                      params: { ...defaultParams.params, exits: { ...defaultParams.params.exits[0], type: undefined } }
                    })
                  ),
                  expect: error => expect(error.data[0].message).to.eql('params.exits[0].type is required')
                })

                behaviours.throwsValidationError('must match', {
                  check: () => (
                    new Signal({
                      ...defaultParams,
                      params: { ...defaultParams.params, exits: { ...defaultParams.params.exits[0], type: chance.string() } }
                    })
                  ),
                  expect: error => expect(error.data[0].message).to.eql(`params.exits[0].type must match one of ${Object.values(OrderOptions.types).join(', ')}`)
                })

                describe('when side is BUY and type is a STOP', () => {
                  behaviours.throwsValidationError('is not supported', {
                    check: () => (
                      new Signal({
                        ...defaultParams,
                        params: {
                          ...defaultParams.params,
                          exits: {
                            ...defaultParams.params.exits[0],
                            side: OrderOptions.sides.BUY,
                            type: OrderOptions.types.STOP_LOSS_LIMIT
                          }
                        }
                      })
                    ),
                    expect: error => expect(error.data[0].message).to.eql('params.exits[0].type does not support BUY')
                  })
                })

                describe('when side is BUY and type is a TAKE PROFIT', () => {
                  behaviours.throwsValidationError('is not supported', {
                    check: () => (
                      new Signal({
                        ...defaultParams,
                        params: {
                          ...defaultParams.params,
                          exits: {
                            ...defaultParams.params.exits[0],
                            side: OrderOptions.sides.BUY,
                            type: OrderOptions.types.TAKE_PROFIT_LIMIT
                          }
                        }
                      })
                    ),
                    expect: error => expect(error.data[0].message).to.eql('params.exits[0].type does not support BUY')
                  })
                })
              })

              describe('baseQuantity', () => {
                describe('when type is MARKET', () => {
                  describe('and neither baseQuantity or quoteQuantity are provided', () => {
                    behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                      check: () => (
                        new Signal({
                          ...defaultParams,
                          params: {
                            ...defaultParams.params,
                            exits: {
                              ...defaultParams.params.exits[0],
                              type: OrderOptions.types.MARKET,
                              baseQuantity: undefined,
                              quoteQuantity: undefined
                            }
                          }
                        })
                      ),
                      expect: error => expect(error.data[0].message).to.eql('params.exits[0].baseQuantity or params.exits[0].quoteQuantity is required')
                    })
                  })

                  describe('and both baseQuantity and quoteQuantity are provided', () => {
                    behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                      check: () => (
                        new Signal({
                          ...defaultParams,
                          params: {
                            ...defaultParams.params,
                            exits: {
                              ...defaultParams.params.exits[0],
                              type: OrderOptions.types.MARKET,
                              baseQuantity: 100,
                              quoteQuantity: 100
                            }
                          }
                        })
                      ),
                      expect: error => expect(error.data[0].message).to.eql('params.exits[0].baseQuantity or params.exits[0].quoteQuantity is required')
                    })
                  })
                })

                describe('when type is LIMIT', () => {
                  describe('and neither baseQuantity or quoteQuantity are provided', () => {
                    behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                      check: () => (
                        new Signal({
                          ...defaultParams,
                          params: {
                            ...defaultParams.params,
                            exits: {
                              ...defaultParams.params.exits[0],
                              type: OrderOptions.types.LIMIT,
                              side: OrderOptions.sides.BUY,
                              baseQuantity: undefined,
                              quoteQuantity: undefined
                            }
                          }
                        })
                      ),
                      expect: error => expect(error.data[0].message).to.eql('params.exits[0].baseQuantity or params.exits[0].quoteQuantity is required')
                    })
                  })

                  describe('and both baseQuantity and quoteQuantity are provided', () => {
                    behaviours.throwsValidationError('requires baseQuantity or quoteQuantity', {
                      check: () => (
                        new Signal({
                          ...defaultParams,
                          params: {
                            ...defaultParams.params,
                            exits: {
                              ...defaultParams.params.exits[0],
                              type: OrderOptions.types.LIMIT,
                              side: OrderOptions.sides.SELL,
                              baseQuantity: 100,
                              quoteQuantity: 100
                            }
                          }
                        })
                      ),
                      expect: error => expect(error.data[0].message).to.eql('params.exits[0].baseQuantity or params.exits[0].quoteQuantity is required')
                    })
                  })
                })

                describe('when type is not MARKET or LIMIT', () => {
                  behaviours.throwsValidationError('is required', {
                    check: () => (
                      new Signal({
                        ...defaultParams,
                        params: {
                          ...defaultParams.params,
                          exits: {
                            ...defaultParams.params.exits[0],
                            type: OrderOptions.types.STOP_LOSS_LIMIT,
                            baseQuantity: undefined,
                            quoteQuantity: undefined
                          }
                        }
                      })
                    ),
                    expect: error => expect(error.data[0].message).to.eql('params.exits[0].baseQuantity is required')
                  })
                })
              })

              describe('price', () => {
                describe('when type has LIMIT', () => {
                  behaviours.throwsValidationError('is required', {
                    check: () => (
                      new Signal({
                        ...defaultParams,
                        params: {
                          ...defaultParams.params,
                          exits: {
                            ...defaultParams.params.exits[0],
                            type: OrderOptions.types.STOP_LOSS_LIMIT,
                            baseQuantity: 100,
                            quoteQuantity: undefined,
                            price: undefined
                          }
                        }
                      })
                    ),
                    expect: error => expect(error.data[0].message).to.eql('params.exits[0].price is required')
                  })
                })
              })

              describe('stopPrice', () => {
                describe('when type has STOP_LOSS', () => {
                  behaviours.throwsValidationError('is required', {
                    check: () => (
                      new Signal({
                        ...defaultParams,
                        params: {
                          ...defaultParams.params,
                          exits: {
                            ...defaultParams.params.exits[0],
                            type: OrderOptions.types.STOP_LOSS_LIMIT,
                            side: OrderOptions.sides.SELL,
                            baseQuantity: 100,
                            quoteQuantity: undefined,
                            stopPrice: undefined
                          }
                        }
                      })
                    ),
                    expect: error => expect(error.data[0].message).to.eql('params.exits[0].stopPrice is required')
                  })
                })

                describe('when type has TAKE_PROFIT', () => {
                  behaviours.throwsValidationError('is required', {
                    check: () => (
                      new Signal({
                        ...defaultParams,
                        params: {
                          ...defaultParams.params,
                          exits: {
                            ...defaultParams.params.exits[0],
                            type: OrderOptions.types.TAKE_PROFIT,
                            side: OrderOptions.sides.SELL,
                            baseQuantity: 100,
                            quoteQuantity: undefined,
                            stopPrice: undefined
                          }
                        }
                      })
                    ),
                    expect: error => expect(error.data[0].message).to.eql('params.exits[0].stopPrice is required')
                  })
                })
              })
            })
          })
        })

        describe('when type is CLOSE_POSITION', () => {
          describe('id', () => {
            behaviours.throwsValidationError('is required', {
              check: () => new Signal({ ...defaultParams, type: Signal.types.CLOSE_POSITION, params: { id: undefined } }),
              expect: error => expect(error.data[0].message).to.eql('params.id is required')
            })

            behaviours.throwsValidationError('must be a UUID', {
              check: () => new Signal({ ...defaultParams, type: Signal.types.CLOSE_POSITION, params: { id: chance.string() } }),
              expect: error => expect(error.data[0].message).to.eql('params.id must be a valid UUID')
            })
          })
        })
      })
    })

    describe('rule', () => {
      it('must be an object', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, rule: chance.integer() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('rule must be an Object')
      })

      it('defaults to an empty object', () => {
        const model = new Signal({ ...defaultParams, rule: undefined })

        expect(model.rule).to.eql({})
      })
    })
  })
})
