const { expect, Factory, chance } = require('../helpers')

const Order = require('../../lib/models/order')

describe('Order Model', () => {
  it('has statuses', () => {
    expect(Order.statuses).to.eql({ NEW: 'NEW', OPEN: 'OPEN', FILLED: 'FILLED', CANCELLED: 'CANCELLED' })
  })

  it('has sides', () => {
    expect(Order.sides).to.eql({ BUY: 'BUY', SELL: 'SELL' })
  })

  it('has market types', () => {
    expect(Order.marketTypes).to.eql([Order.types.MARKET, Order.types.STOP_LOSS, Order.types.TAKE_PROFIT])
  })

  it('has limit types', () => {
    expect(Order.limitTypes).to.eql([Order.types.LIMIT, Order.types.STOP_LOSS_LIMIT, Order.types.TAKE_PROFIT_LIMIT])
  })

  it('has types', () => {
    expect(Order.types).to.eql({
      MARKET: 'MARKET',
      LIMIT: 'LIMIT',
      STOP_LOSS: 'STOP_LOSS',
      STOP_LOSS_LIMIT: 'STOP_LOSS_LIMIT',
      TAKE_PROFIT: 'TAKE_PROFIT',
      TAKE_PROFIT_LIMIT: 'TAKE_PROFIT_LIMIT'
    })
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
        side: chance.pickone(Object.values(Order.sides)),
        type: Order.types.LIMIT,
        price: chance.integer({ min: 1, max: 100 }),
        quoteQuantity: 1000.00
      },
      exchange: 'binance',
      market: 'BTC/USDT',
      status: chance.pickone(Object.values(Order.statuses)),
      side: chance.pickone(Object.values(Order.sides)),
      type: Order.types.LIMIT,
      baseQuantityGross: chance.integer({ min: 1, max: 1000 }),
      baseQuantityNet: chance.integer({ min: 1, max: 1000 }),
      quoteQuantityGross: chance.integer({ min: 1, max: 1000 }),
      quoteQuantityNet: chance.integer({ min: 1, max: 1000 }),
      price: chance.integer({ min: 1, max: 100 }),
      averagePrice: chance.integer({ min: 1, max: 100 }),
      trades: []
    }

    describe('id', () => {
      it('must be a UUID', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, id: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('id must be a valid UUID')
      })

      it('defaults to a UUID', () => {
        const model = new Order({ ...defaultParams, id: undefined })

        expect(model.id).be.a.uuid('v4')
      })
    })

    describe('foreignId', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, foreignId: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('foreignId is required')
      })

      it('must be a UUID', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, foreignId: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('foreignId must be a valid UUID')
      })
    })

    describe('exitId', () => {
      it('must be a UUID', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, exitId: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('exitId must be a valid UUID')
      })
    })

    describe('timestamp', () => {
      it('must be a date', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, timestamp: 'tomorrow' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('timestamp must be a Date')
      })

      it('defaults to current time', () => {
        const model = new Order({ ...defaultParams, timestamp: undefined })

        expect(model.timestamp).not.to.be.null()
        expect(model.timestamp).be.closeToTime(new Date(), 1)
      })
    })

    describe('options', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, options: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('options is required')
      })

      it('must be an object', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, options: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('options must be an Object')
      })

      describe('props', () => {
        describe('exchange', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              new Order({ ...defaultParams, options: { ...defaultParams.options, exchange: undefined } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.exchange is required')
          })

          it('must be a string', () => {
            let thrownErr = null

            try {
              new Order({ ...defaultParams, options: { ...defaultParams.options, exchange: chance.integer() } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.exchange must be a string')
          })
        })

        describe('market', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              new Order({ ...defaultParams, options: { ...defaultParams.options, market: undefined } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.market is required')
          })

          it('must be a string', () => {
            let thrownErr = null

            try {
              new Order({ ...defaultParams, options: { ...defaultParams.options, market: chance.integer() } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.market must be a string')
          })
        })

        describe('timestamp', () => {
          it('must be a date', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, timestamp: 'tomorrow' } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.timestamp must be a Date')
          })

          it('defaults to current time', () => {
            const model = new Order({ ...defaultParams, options: { ...defaultParams.options, timestamp: undefined } })

            expect(model.options.timestamp).not.to.be.null()
            expect(model.options.timestamp).be.closeToTime(new Date(), 1)
          })
        })

        describe('side', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, side: undefined } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.side is required')
          })

          it('must match', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, side: chance.string({ max: 5, aplha: true }) } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql(
              `options.side must match one of ${Object.values(Order.sides).join(', ')}`
            )
          })
        })

        describe('type', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, type: undefined } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.type is required')
          })

          it('must match', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, type: chance.string({ max: 5, aplha: true }) } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql(
              `options.type must match one of ${Object.values(Order.types).join(', ')}`
            )
          })
        })

        describe('price', () => {
          it('must be a number', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, price: 'seventy' } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.price must be a number')
          })

          it('must be greater than or equal to 0', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, price: -1 } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.price must be greater than or equal to 0')
          })
        })

        describe('stopPrice', () => {
          it('must be a number', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, stopPrice: 'seventy' } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.stopPrice must be a number')
          })

          it('must be greater than or equal to 0', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, stopPrice: -1 } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.stopPrice must be greater than or equal to 0')
          })

          describe('when is MARKET', () => {
            it('defaults to underfined', () => {
              const model = new Order({ ...defaultParams, options: { ...defaultParams.options, type: 'MARKET', stopPrice: undefined } })

              expect(model.options.stopPrice).to.undefined()
            })
          })
        })

        describe('options.baseQuantity', () => {
          it('must be a number', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, baseQuantity: 'seventy' } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.baseQuantity must be a number')
          })

          it('must be greater than or equal to 0', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, baseQuantity: -1 } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.baseQuantity must be greater than or equal to 0')
          })
        })

        describe('options.quoteQuantity', () => {
          it('must be a number', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, quoteQuantity: 'seventy' } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.quoteQuantity must be a number')
          })

          it('must be greater than or equal to 0', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new Order({ ...defaultParams, options: { ...defaultParams.options, quoteQuantity: -1 } })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('options.quoteQuantity must be greater than or equal to 0')
          })
        })
      })
    })

    describe('exchange', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, exchange: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('exchange is required')
      })

      it('must be a string', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, exchange: chance.integer() }) /* eslint-disable-line no-new */
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
          new Order({ ...defaultParams, market: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('market is required')
      })

      it('must be a string', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, market: chance.integer() }) /* eslint-disable-line no-new */
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
          new Order({ ...defaultParams, status: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql(
          `status must match one of ${Object.values(Order.statuses).join(', ')}`
        )
      })

      it('defaults to NEW', () => {
        const model = new Order({ ...defaultParams, status: undefined })

        expect(model.status).not.to.be.null()
        expect(model.status).be.eql(Order.statuses.NEW)
      })
    })

    describe('side', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, side: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('side is required')
      })

      it('must match', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, side: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql(
          `side must match one of ${Object.values(Order.sides).join(', ')}`
        )
      })
    })

    describe('type', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, type: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('type is required')
      })

      it('must match', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, type: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql(
          `type must match one of ${Object.values(Order.types).join(', ')}`
        )
      })
    })

    describe('baseQuantityGross', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, baseQuantityGross: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantityGross must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, baseQuantityGross: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantityGross must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Order({ ...defaultParams, baseQuantityGross: undefined })

        expect(model.baseQuantityGross).not.to.be.null()
        expect(model.baseQuantityGross).be.eql('0')
      })
    })

    describe('baseQuantityNet', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, baseQuantityNet: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantityNet must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, baseQuantityNet: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantityNet must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Order({ ...defaultParams, baseQuantityNet: undefined })

        expect(model.baseQuantityNet).not.to.be.null()
        expect(model.baseQuantityNet).be.eql('0')
      })
    })

    describe('quoteQuantityGross', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, quoteQuantityGross: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantityGross must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, quoteQuantityGross: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantityGross must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Order({ ...defaultParams, quoteQuantityGross: undefined })

        expect(model.quoteQuantityGross).not.to.be.null()
        expect(model.quoteQuantityGross).be.eql('0')
      })
    })

    describe('quoteQuantityNet', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, quoteQuantityNet: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantityNet must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, quoteQuantityNet: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantityNet must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Order({ ...defaultParams, quoteQuantityNet: undefined })

        expect(model.quoteQuantityNet).not.to.be.null()
        expect(model.quoteQuantityNet).be.eql('0')
      })
    })

    describe('price', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, price: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('price must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, price: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('price must be greater than or equal to 0')
      })
    })

    describe('stopPrice', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, price: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('price must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, price: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('price must be greater than or equal to 0')
      })
    })

    describe('stopPriceHit', () => {
      it('must be a boolean', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, stopPriceHit: 'sure' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('stopPriceHit must be a boolean')
      })
    })

    describe('averagePrice', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, averagePrice: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('averagePrice must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, averagePrice: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('averagePrice must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Order({ ...defaultParams, averagePrice: undefined })

        expect(model.averagePrice).not.to.be.null()
        expect(model.averagePrice).be.eql('0')
      })
    })

    describe('trades', () => {
      it('must be an array', () => {
        let thrownErr = null

        try {
          new Order({ ...defaultParams, trades: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('trades must be an array')
      })

      describe('items', () => {
        it('must be an instance of Trade', () => {
          let thrownErr = null

          try {
            new Order({ ...defaultParams, trades: [{}] }) /* eslint-disable-line no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('trades[0] must be an instance of the Trade class')
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
        type: Order.types.LIMIT,
        price: 10,
        quoteQuantity: 1000,
        averagePrice: '10',
        baseQuantityGross: '100',
        baseQuantityNet: '99.9',
        quoteQuantityGross: '1000',
        quoteQuantityNet: '1000'
      })

      const order = Order.fromExchangeOrder(exchangeOrder)

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

    it('allows setting overrides', () => {
      const exchangeOrder = Factory('exchangeOrder').build({
        status: Order.statuses.FILLED,
        type: Order.types.LIMIT,
        price: 10,
        quoteQuantity: 1000,
        averagePrice: '10',
        baseQuantityGross: '100',
        baseQuantityNet: '99.9',
        quoteQuantityGross: '1000',
        quoteQuantityNet: '1000'
      })

      const order = Order.fromExchangeOrder(exchangeOrder, { averagePrice: '20' })

      expect(order.averagePrice).to.eql('20')
    })
  })
})
