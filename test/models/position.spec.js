const _ = require('lodash')

const { expect, Factory, chance, moment } = require('../helpers')

const { Position, Order } = require('../../lib/models')

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
        entry: {
          exchange: 'binance',
          market: 'BTC/USDT',
          type: chance.pickone(Object.values(Order.types)),
          price: chance.integer({ min: 1, max: 100 }),
          quoteQuantity: 1000.00
        },
        exit: [
          {
            exchange: 'binance',
            market: 'BTC/USDT',
            type: chance.pickone([Order.types.STOP_LOSS_LIMIT, Order.types.TAKE_PROFIT_LIMIT]),
            price: chance.integer({ min: 1, max: 100 }),
            quoteQuantity: 1000.00
          },
          {
            exchange: 'binance',
            market: 'BTC/USDT',
            type: chance.pickone([Order.types.STOP_LOSS_LIMIT, Order.types.TAKE_PROFIT_LIMIT]),
            price: chance.integer({ min: 1, max: 100 }),
            quoteQuantity: 1000.00
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
      it('must be a UUID', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, id: 'random-id' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('id must be a valid UUID')
      })

      it('defaults to a UUID', () => {
        const model = new Position({ ...defaultParams, id: undefined })

        expect(model.id).be.a.uuid('v4')
      })
    })

    describe('signalId', () => {
      it('must be a UUID', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, signalId: 'random-id' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('signalId must be a valid UUID')
      })
    })

    describe('timestamp', () => {
      it('must be a date', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, timestamp: 'tomorrow' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('timestamp must be a Date')
      })

      it('defaults to current time', () => {
        const model = new Position({ ...defaultParams, timestamp: undefined })

        expect(model.timestamp).not.to.be.null()
        expect(model.timestamp).be.closeToTime(new Date(), 1)
      })
    })

    describe('exchange', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, exchange: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('exchange is required')
      })

      it('must be a string', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, exchange: chance.integer() }) /* eslint-disable-line no-new */
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
          new Position({ ...defaultParams, market: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('market is required')
      })

      it('must be a string', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, market: chance.integer() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('market must be a string')
      })
    })

    describe('status', () => {
      it('must match', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, status: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql(
          `status must match one of ${Object.values(Position.statuses).join(', ')}`
        )
      })

      it('defaults to NEW', () => {
        const model = new Position({ ...defaultParams, status: undefined })

        expect(model.status).not.to.be.null()
        expect(model.status).be.eql(Position.statuses.NEW)
      })
    })

    describe('type', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, type: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('type is required')
      })

      it('must match', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, type: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql(
          `type must match one of ${Object.values(Position.types).join(', ')}`
        )
      })
    })

    describe('entry', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, entry: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('entry is required')
      })

      it('must be an object', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, entry: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('entry must be an Object')
      })

      describe('props', () => {
        describe('exchange', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, exchange: undefined } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('entry.exchange is required')
          })

          it('must be a string', () => {
            let thrownErr = null

            try {
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, exchange: chance.integer() } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('entry.exchange must be a string')
          })
        })

        describe('market', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, market: undefined } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('entry.market is required')
          })

          it('must be a string', () => {
            let thrownErr = null

            try {
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, market: chance.integer() } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('entry.market must be a string')
          })
        })

        describe('type', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, type: undefined } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('entry.type is required')
          })

          it('must match', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, type: chance.string({ max: 5, aplha: true }) } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql(
              `entry.type must match one of ${Object.values(Order.types).join(', ')}`
            )
          })
        })

        describe('price', () => {
          it('must be a number', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, price: 'seventy' } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('entry.price must be a number')
          })

          it('must be greater than or equal to 0', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, price: -1 } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('entry.price must be greater than or equal to 0')
          })

          describe('when type has LIMIT', () => {
            it('is required', () => {
              let thrownErr = null

              try {
                /* eslint-disable no-new */
                new Position({ ...defaultParams, entry: { ...defaultParams.entry, type: 'LIMIT', price: undefined } })
                /* eslint-enable no-new */
              } catch (err) {
                thrownErr = err
              }

              expect(thrownErr.type).to.eql('VALIDATION_ERROR')
              expect(thrownErr.data[0].message).to.eql('entry.price is required')
            })
          })

          describe('when type is not LIMIT', () => {
            it('defaults to underfined', () => {
              const model = new Position({ ...defaultParams, entry: { ...defaultParams.entry, type: 'MARKET', price: undefined } })

              expect(model.entry.price).to.undefined()
            })
          })
        })

        describe('entry.baseQuantity', () => {
          it('must be a number', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, baseQuantity: 'seventy' } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('entry.baseQuantity must be a number')
          })

          it('must be greater than or equal to 0', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, baseQuantity: -1 } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('entry.baseQuantity must be greater than or equal to 0')
          })

          it('requires either baseQuantity or quoteQuantity but not both', () => {
            let noneErr = null
            let bothErr = null

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, baseQuantity: undefined, quoteQuantity: undefined } })
              /* eslint-enable no-new */
            } catch (err) {
              noneErr = err
            }

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, baseQuantity: 1, quoteQuantity: 1 } })
              /* eslint-enable no-new */
            } catch (err) {
              bothErr = err
            }

            expect(noneErr.type).to.eql('VALIDATION_ERROR')
            expect(noneErr.data[0].message).to.eql('entry.baseQuantity or entry.quoteQuantity is required')
            expect(bothErr.type).to.eql('VALIDATION_ERROR')
            expect(bothErr.data[0].message).to.eql('entry.baseQuantity or entry.quoteQuantity is required')
          })
        })

        describe('entry.quoteQuantity', () => {
          it('must be a number', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, quoteQuantity: 'seventy' } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('entry.quoteQuantity must be a number')
          })

          it('must be greater than or equal to 0', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, entry: { ...defaultParams.entry, quoteQuantity: -1 } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('entry.quoteQuantity must be greater than or equal to 0')
          })
        })
      })
    })

    describe('exit', () => {
      it('must be an array of objects', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, exit: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('exit[0] must be an Object')
      })

      it('defaults to an array empty', () => {
        const position = new Position({ ...defaultParams, exit: undefined })

        expect(position.exit).to.eql([])
      })

      describe('props', () => {
        describe('exchange', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              new Position({ ...defaultParams, exit: [{ ...defaultParams.exit[0], exchange: undefined }] }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('exit[0].exchange is required')
          })

          it('must be a string', () => {
            let thrownErr = null

            try {
              new Position({ ...defaultParams, exit: [{ ...defaultParams.exit[0], exchange: chance.integer() }] }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('exit[0].exchange must be a string')
          })
        })

        describe('market', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              new Position({ ...defaultParams, exit: [{ ...defaultParams.exit[0], market: undefined }] }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('exit[0].market is required')
          })

          it('must be a string', () => {
            let thrownErr = null

            try {
              new Position({ ...defaultParams, exit: [{ ...defaultParams.exit[0], market: chance.integer() }] }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('exit[0].market must be a string')
          })
        })

        describe('type', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, exit: [{ ...defaultParams.exit[0], type: undefined }] })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('exit[0].type is required')
          })

          it('must match', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, exit: [{ ...defaultParams.exit[0], type: chance.string({ max: 5, aplha: true }) }] })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql(
              `exit[0].type must match one of ${Object.values(Order.types).join(', ')}`
            )
          })
        })

        describe('price', () => {
          describe('when type has LIMIT', () => {
            it('is required', () => {
              let thrownErr = null

              try {
                /* eslint-disable no-new */
                new Position({ ...defaultParams, exit: [{ ...defaultParams.exit[0], type: 'LIMIT', price: undefined }] })
                /* eslint-enable no-new */
              } catch (err) {
                thrownErr = err
              }

              expect(thrownErr.type).to.eql('VALIDATION_ERROR')
              expect(thrownErr.data[0].message).to.eql('exit[0].price is required')
            })
          })

          describe('when type does not have LIMIT', () => {
            it('defaults to underfined', () => {
              const model = new Position({ ...defaultParams, exit: [{ ...defaultParams.exit[0], type: 'MARKET', price: undefined }] })

              expect(model.exit.price).to.undefined()
            })
          })
        })

        describe('baseQuantity', () => {
          it('requires either baseQuantity or quoteQuantity but not both', () => {
            let noneErr = null
            let bothErr = null

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, exit: [{ ...defaultParams.exit[0], baseQuantity: undefined, quoteQuantity: undefined }] })
              /* eslint-enable no-new */
            } catch (err) {
              noneErr = err
            }

            try {
              /* eslint-disable no-new */
              new Position({ ...defaultParams, exit: [{ ...defaultParams.exit[0], baseQuantity: 1, quoteQuantity: 1 }] })
              /* eslint-enable no-new */
            } catch (err) {
              bothErr = err
            }

            expect(noneErr.type).to.eql('VALIDATION_ERROR')
            expect(noneErr.data[0].message).to.eql('exit[0].baseQuantity or exit[0].quoteQuantity is required')
            expect(bothErr.type).to.eql('VALIDATION_ERROR')
            expect(bothErr.data[0].message).to.eql('exit[0].baseQuantity or exit[0].quoteQuantity is required')
          })
        })
      })
    })

    describe('win', () => {
      it('must be a boolean', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, win: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('win must be a boolean')
      })

      it('defaults to null', () => {
        const model = new Position({ ...defaultParams, win: undefined })

        expect(model.win).to.be.null()
      })
    })

    describe('realizedPnL', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, realizedPnL: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('realizedPnL must be a number')
      })

      it('defaults to 0', () => {
        const model = new Position({ ...defaultParams, realizedPnL: undefined })

        expect(model.realizedPnL).not.to.be.null()
        expect(model.realizedPnL).be.eql('0')
      })
    })

    describe('realizedPnLPercent', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, realizedPnLPercent: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('realizedPnLPercent must be a number')
      })

      it('defaults to 0', () => {
        const model = new Position({ ...defaultParams, realizedPnLPercent: undefined })

        expect(model.realizedPnLPercent).not.to.be.null()
        expect(model.realizedPnLPercent).be.eql('0')
      })
    })

    describe('unrealizedPnL', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, unrealizedPnL: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('unrealizedPnL must be a number')
      })

      it('defaults to 0', () => {
        const model = new Position({ ...defaultParams, unrealizedPnL: undefined })

        expect(model.unrealizedPnL).not.to.be.null()
        expect(model.unrealizedPnL).be.eql('0')
      })
    })

    describe('unrealizedPnLPercent', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, unrealizedPnLPercent: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('unrealizedPnLPercent must be a number')
      })

      it('defaults to 0', () => {
        const model = new Position({ ...defaultParams, unrealizedPnLPercent: undefined })

        expect(model.unrealizedPnLPercent).not.to.be.null()
        expect(model.unrealizedPnLPercent).be.eql('0')
      })
    })

    describe('pnl', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, pnl: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('pnl must be a number')
      })

      it('defaults to 0', () => {
        const model = new Position({ ...defaultParams, pnl: undefined })

        expect(model.pnl).not.to.be.null()
        expect(model.pnl).be.eql('0')
      })
    })

    describe('pnlPercent', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, pnlPercent: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('pnlPercent must be a number')
      })

      it('defaults to 0', () => {
        const model = new Position({ ...defaultParams, pnlPercent: undefined })

        expect(model.pnlPercent).not.to.be.null()
        expect(model.pnlPercent).be.eql('0')
      })
    })

    describe('orders', () => {
      it('must be an array', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, orders: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('orders must be an array')
      })

      describe('items', () => {
        it('must be an instance of Order', () => {
          let thrownErr = null

          try {
            new Position({ ...defaultParams, orders: [{ side: 'BUY' }] }) /* eslint-disable-line no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('orders[0] must be an instance of the Order class')
        })
      })

      it('defaults to an empty array', () => {
        const model = new Position({ ...defaultParams, orders: undefined })

        expect(model.orders).not.to.be.null()
        expect(model.orders).be.eql([])
      })
    })

    describe('statistics', () => {
      it('must be an Object', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, statistics: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('statistics must be an Object')
      })

      it('defaults to an empty Object', () => {
        const model = new Position({ ...defaultParams, statistics: undefined })

        expect(model.orders).not.to.be.null()
        expect(model.statistics).be.eql({})
      })

      describe('props', () => {
        describe('duration', () => {
          it('must be a number', () => {
            let thrownErr = null

            try {
              new Position({ ...defaultParams, statistics: { duration: chance.string() } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('statistics.duration must be a number')
          })
        })
      })
    })

    describe('createdAt', () => {
      it('must be a date', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, createdAt: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('createdAt must be a Date')
      })

      it('defaults to the current time', () => {
        const model = new Position({ ...defaultParams, createdAt: undefined })

        expect(model.createdAt).not.to.be.null()
        expect(model.createdAt).be.closeToTime(new Date(), 1000)
      })
    })

    describe('closedAt', () => {
      it('must be a date', () => {
        let thrownErr = null

        try {
          new Position({ ...defaultParams, closedAt: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('closedAt must be a Date')
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
        const buyOrder = Factory('exchangeOrder').build({ side: Order.sides.BUY, status: Order.statuses.FILLED, baseQuantity: 100 })
        const sellOrder = Factory('exchangeOrder').build({ side: Order.sides.SELL, status: Order.statuses.FILLED, baseQuantity: 100 })
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
        const buyOrder = Factory('exchangeOrder').build({ side: Order.sides.BUY, status: Order.statuses.FILLED, baseQuantity: 100 })
        const sellOrder = Factory('exchangeOrder').build({ side: Order.sides.SELL, status: Order.statuses.FILLED, baseQuantity: 100 })
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
