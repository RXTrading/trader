const { expect, chance, Factory } = require('../helpers')

const ExchangeOrder = require('../../lib/models/exchangeOrder')

describe('ExchangeOrder Model', () => {
  it('has statuses', () => {
    expect(ExchangeOrder.statuses).to.eql({ NEW: 'NEW', OPEN: 'OPEN', FILLED: 'FILLED', CANCELLED: 'CANCELLED' })
  })

  it('has sides', () => {
    expect(ExchangeOrder.sides).to.eql({ BUY: 'BUY', SELL: 'SELL' })
  })

  it('has types', () => {
    expect(ExchangeOrder.types).to.eql({
      MARKET: 'MARKET',
      LIMIT: 'LIMIT',
      STOP_LOSS: 'STOP_LOSS',
      STOP_LOSS_LIMIT: 'STOP_LOSS_LIMIT',
      TAKE_PROFIT: 'TAKE_PROFIT',
      TAKE_PROFIT_LIMIT: 'TAKE_PROFIT_LIMIT'
    })
  })

  it('has market types', () => {
    expect(ExchangeOrder.marketTypes).to.eql([ExchangeOrder.types.MARKET, ExchangeOrder.types.STOP_LOSS, ExchangeOrder.types.TAKE_PROFIT])
  })

  it('has limit types', () => {
    expect(ExchangeOrder.limitTypes).to.eql([ExchangeOrder.types.LIMIT, ExchangeOrder.types.STOP_LOSS_LIMIT, ExchangeOrder.types.TAKE_PROFIT_LIMIT])
  })

  describe('params', () => {
    const defaultParams = {
      id: chance.guid({ version: 4 }),
      timestamp: chance.date(),
      exchange: 'binance',
      market: 'BTC/USDT',
      status: chance.pickone(Object.values(ExchangeOrder.statuses)),
      side: ExchangeOrder.sides.BUY,
      type: ExchangeOrder.types.LIMIT,
      baseQuantity: 100,
      quoteQuantity: 1000.00,
      price: 10,
      baseQuantityGross: chance.integer({ min: 1, max: 1000 }),
      baseQuantityNet: chance.integer({ min: 1, max: 1000 }),
      quoteQuantityGross: chance.integer({ min: 1, max: 1000 }),
      quoteQuantityNet: chance.integer({ min: 1, max: 1000 }),
      averagePrice: chance.integer({ min: 1, max: 100 }),
      trades: []
    }

    describe('id', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, id: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('id is required')
      })

      it('must be a UUID', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, id: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('id must be a valid UUID')
      })
    })

    describe('timestamp', () => {
      it('must be a date', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, timestamp: 'tomorrow' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('timestamp must be a Date')
      })

      it('defaults to current time', () => {
        const model = new ExchangeOrder({ ...defaultParams, timestamp: undefined })

        expect(model.timestamp).not.to.be.null()
        expect(model.timestamp).be.closeToTime(new Date(), 1)
      })
    })

    describe('exchange', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, exchange: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('exchange is required')
      })

      it('must be a string', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, exchange: chance.integer() }) /* eslint-disable-line no-new */
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
          new ExchangeOrder({ ...defaultParams, market: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('market is required')
      })

      it('must be a string', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, market: chance.integer() }) /* eslint-disable-line no-new */
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
          new ExchangeOrder({ ...defaultParams, status: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql(
          `status must match one of ${Object.values(ExchangeOrder.statuses).join(', ')}`
        )
      })

      it('defaults to NEW', () => {
        const model = new ExchangeOrder({ ...defaultParams, status: undefined })

        expect(model.status).not.to.be.null()
        expect(model.status).be.eql(ExchangeOrder.statuses.NEW)
      })
    })

    describe('side', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, side: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('side is required')
      })

      it('must match', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, side: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql(
          `side must match one of ${Object.values(ExchangeOrder.sides).join(', ')}`
        )
      })
    })

    describe('type', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, type: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('type is required')
      })

      it('must match', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, type: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql(
          `type must match one of ${Object.values(ExchangeOrder.types).join(', ')}`
        )
      })

      describe('when type is MARKET or LIMIT', () => {
        it('supports BUY and SELL side', () => {
          const marketBuy = new ExchangeOrder({
            ...defaultParams,
            type: ExchangeOrder.types.MARKET,
            side: ExchangeOrder.sides.BUY,
            baseQuantity: undefined
          })
          const marketSell = new ExchangeOrder({
            ...defaultParams,
            type: ExchangeOrder.types.MARKET,
            side: ExchangeOrder.sides.SELL,
            baseQuantity: 1,
            quoteQuantity: undefined
          })
          const limitBuy = new ExchangeOrder({
            ...defaultParams,
            type: ExchangeOrder.types.LIMIT,
            side: ExchangeOrder.sides.BUY
          })
          const limitSell = new ExchangeOrder({
            ...defaultParams,
            type: ExchangeOrder.types.LIMIT,
            side: ExchangeOrder.sides.SELL
          })

          expect(marketBuy.id).not.to.be.null()
          expect(marketSell.id).not.to.be.null()
          expect(limitBuy.id).not.to.be.null()
          expect(limitSell.id).not.to.be.null()
        })
      })

      describe('when type is not MARKET or LIMIT', () => {
        it('supports only SELL', () => {
          let thrownErr = null

          try {
            /* eslint-disable no-new */
            new ExchangeOrder({
              ...defaultParams,
              type: ExchangeOrder.types.STOP_LOSS,
              side: ExchangeOrder.sides.BUY
            })
            /* eslint-enable no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('type supports SELL only')
        })
      })
    })

    describe('baseQuantity', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          /* eslint-disable no-new */
          new ExchangeOrder({ ...defaultParams, baseQuantity: 'seventy' })
          /* eslint-enable no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantity must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          /* eslint-disable no-new */
          new ExchangeOrder({ ...defaultParams, baseQuantity: -1 })
          /* eslint-enable no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantity must be greater than or equal to 0')
      })

      describe('when type is MARKET', () => {
        describe('when side is BUY', () => {
          it('is not required', () => {
            const order = new ExchangeOrder({
              ...defaultParams,
              side: ExchangeOrder.sides.BUY,
              type: ExchangeOrder.types.MARKET,
              baseQuantity: undefined
            })

            expect(order.baseQuantity).to.eql(undefined)
          })
        })

        describe('when side is SELL', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new ExchangeOrder({
                ...defaultParams,
                side: ExchangeOrder.sides.SELL,
                type: ExchangeOrder.types.MARKET,
                baseQuantity: undefined
              })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('baseQuantity is required')
          })
        })
      })

      describe('when type is LIMIT', () => {
        describe('when side is BUY', () => {
          it('is not required', () => {
            const order = new ExchangeOrder({
              ...defaultParams,
              side: ExchangeOrder.sides.BUY,
              type: ExchangeOrder.types.LIMIT,
              baseQuantity: undefined
            })

            expect(order.baseQuantity).to.eql(undefined)
          })
        })

        describe('when side is SELL', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new ExchangeOrder({
                ...defaultParams,
                side: ExchangeOrder.sides.SELL,
                type: ExchangeOrder.types.LIMIT,
                baseQuantity: undefined
              })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('baseQuantity is required')
          })
        })
      })

      describe('when any other type', () => {
        it('is required', () => {
          let thrownErr = null

          try {
            /* eslint-disable no-new */
            new ExchangeOrder({
              ...defaultParams,
              side: ExchangeOrder.sides.SELL,
              type: ExchangeOrder.types.STOP_LOSS,
              baseQuantity: undefined
            })
            /* eslint-enable no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('baseQuantity is required')
        })
      })
    })

    describe('quoteQuantity', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          /* eslint-disable no-new */
          new ExchangeOrder({ ...defaultParams, quoteQuantity: 'seventy' })
          /* eslint-enable no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantity must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          /* eslint-disable no-new */
          new ExchangeOrder({ ...defaultParams, quoteQuantity: -1 })
          /* eslint-enable no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantity must be greater than or equal to 0')
      })

      describe('when type is MARKET', () => {
        describe('when side is BUY', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new ExchangeOrder({
                ...defaultParams,
                side: ExchangeOrder.sides.BUY,
                type: ExchangeOrder.types.MARKET,
                baseQuantity: 1,
                quoteQuantity: undefined
              })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('quoteQuantity is required')
          })
        })

        describe('when side is SELL', () => {
          it('is not required', () => {
            const order = new ExchangeOrder({
              ...defaultParams,
              side: ExchangeOrder.sides.SELL,
              type: ExchangeOrder.types.MARKET,
              quoteQuantity: undefined,
              baseQuantity: 1
            })

            expect(order.quoteQuantity).to.eql(undefined)
          })
        })
      })

      describe('when type is LIMIT', () => {
        describe('when side is BUY', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              /* eslint-disable no-new */
              new ExchangeOrder({
                ...defaultParams,
                side: ExchangeOrder.sides.BUY,
                type: ExchangeOrder.types.LIMIT,
                baseQuantity: 1,
                quoteQuantity: undefined
              })
              /* eslint-enable no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('quoteQuantity is required')
          })
        })

        describe('when side is SELL', () => {
          it('is not required', () => {
            const order = new ExchangeOrder({
              ...defaultParams,
              side: ExchangeOrder.sides.SELL,
              type: ExchangeOrder.types.LIMIT,
              baseQuantity: 1,
              quoteQuantity: undefined
            })

            expect(order.quoteQuantity).to.eql(undefined)
          })
        })
      })

      describe('when any other type', () => {
        it('is not required', () => {
          const order = new ExchangeOrder({
            ...defaultParams,
            side: ExchangeOrder.sides.SELL,
            type: ExchangeOrder.types.TAKE_PROFIT,
            quoteQuantity: undefined,
            stopPrice: 100,
            baseQuantity: 1
          })

          expect(order.quoteQuantity).to.eql(undefined)
        })
      })
    })

    describe('baseQuantityGross', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, baseQuantityGross: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantityGross must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, baseQuantityGross: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantityGross must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new ExchangeOrder({ ...defaultParams, baseQuantityGross: undefined })

        expect(model.baseQuantityGross).not.to.be.null()
        expect(model.baseQuantityGross).be.eql('0')
      })
    })

    describe('baseQuantityNet', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, baseQuantityNet: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantityNet must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, baseQuantityNet: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantityNet must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new ExchangeOrder({ ...defaultParams, baseQuantityNet: undefined })

        expect(model.baseQuantityNet).not.to.be.null()
        expect(model.baseQuantityNet).be.eql('0')
      })
    })

    describe('quoteQuantityGross', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, quoteQuantityGross: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantityGross must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, quoteQuantityGross: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantityGross must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new ExchangeOrder({ ...defaultParams, quoteQuantityGross: undefined })

        expect(model.quoteQuantityGross).not.to.be.null()
        expect(model.quoteQuantityGross).be.eql('0')
      })
    })

    describe('quoteQuantityNet', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, quoteQuantityNet: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantityNet must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, quoteQuantityNet: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantityNet must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new ExchangeOrder({ ...defaultParams, quoteQuantityNet: undefined })

        expect(model.quoteQuantityNet).not.to.be.null()
        expect(model.quoteQuantityNet).be.eql('0')
      })
    })

    describe('price', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, price: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('price must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, price: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('price must be greater than or equal to 0')
      })

      describe('when type has LIMIT', () => {
        it('is required', () => {
          let thrownErr = null

          try {
            /* eslint-disable no-new */
            new ExchangeOrder({ ...defaultParams, type: 'LIMIT', price: undefined })
            /* eslint-enable no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('price is required')
        })
      })

      describe('when type does not have LIMIT', () => {
        it('defaults to underfined', () => {
          const model = new ExchangeOrder({
            ...defaultParams,
            type: 'MARKET',
            baseQuantity: undefined,
            price: undefined
          })

          expect(model.price).to.undefined()
        })
      })
    })

    describe('stopPrice', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, stopPrice: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('stopPrice must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, stopPrice: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('stopPrice must be greater than or equal to 0')
      })

      describe('when type is STOP_LOSS', () => {
        it('is required', () => {
          let thrownErr = null

          try {
            /* eslint-disable no-new */
            new ExchangeOrder({
              ...defaultParams,
              side: ExchangeOrder.sides.SELL,
              type: ExchangeOrder.types.STOP_LOSS,
              baseQuantity: chance.integer({ min: 1, max: 1000 }),
              quoteQuantity: undefined,
              stopPrice: undefined
            })
            /* eslint-enable no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('stopPrice is required')
        })
      })

      describe('when type is STOP_LOSS_LIMIT', () => {
        it('is required', () => {
          let thrownErr = null

          try {
            /* eslint-disable no-new */
            new ExchangeOrder({
              ...defaultParams,
              side: ExchangeOrder.sides.SELL,
              type: ExchangeOrder.types.STOP_LOSS_LIMIT,
              baseQuantity: chance.integer({ min: 1, max: 1000 }),
              quoteQuantity: undefined,
              stopPrice: undefined
            })
            /* eslint-enable no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('stopPrice is required')
        })
      })

      describe('when type has TAKE_PROFIT', () => {
        it('is required', () => {
          let thrownErr = null

          try {
            /* eslint-disable no-new */
            new ExchangeOrder({
              ...defaultParams,
              side: ExchangeOrder.sides.SELL,
              type: ExchangeOrder.types.TAKE_PROFIT,
              baseQuantity: chance.integer({ min: 1, max: 1000 }),
              quoteQuantity: undefined,
              stopPrice: undefined
            })
            /* eslint-enable no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('stopPrice is required')
        })
      })

      describe('when type is TAKE_PROFIT_LIMIT', () => {
        it('is required', () => {
          let thrownErr = null

          try {
            /* eslint-disable no-new */
            new ExchangeOrder({
              ...defaultParams,
              side: ExchangeOrder.sides.SELL,
              type: ExchangeOrder.types.TAKE_PROFIT_LIMIT,
              baseQuantity: chance.integer({ min: 1, max: 1000 }),
              quoteQuantity: undefined,
              stopPrice: undefined
            })
            /* eslint-enable no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('stopPrice is required')
        })
      })

      describe('when is MARKET', () => {
        it('defaults to underfined', () => {
          const model = new ExchangeOrder({
            ...defaultParams,
            type: ExchangeOrder.types.MARKET,
            baseQuantity: undefined
            // stopPrice: undefined
          })

          expect(model.stopPrice).to.undefined()
        })
      })
    })

    describe('stopPriceHit', () => {
      it('must be a boolean', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, stopPriceHit: 'sure' }) /* eslint-disable-line no-new */
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
          new ExchangeOrder({ ...defaultParams, averagePrice: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('averagePrice must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, averagePrice: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('averagePrice must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new ExchangeOrder({ ...defaultParams, averagePrice: undefined })

        expect(model.averagePrice).not.to.be.null()
        expect(model.averagePrice).be.eql('0')
      })
    })

    describe('trades', () => {
      it('must be an array', () => {
        let thrownErr = null

        try {
          new ExchangeOrder({ ...defaultParams, trades: chance.string() }) /* eslint-disable-line no-new */
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
            new ExchangeOrder({ ...defaultParams, trades: [{}] }) /* eslint-disable-line no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('trades[0] must be an instance of the Trade class')
        })
      })

      it('defaults to an empty array', () => {
        const model = new ExchangeOrder({ ...defaultParams, trades: undefined })

        expect(model.trades).not.to.be.null()
        expect(model.trades).be.eql([])
      })
    })
  })

  describe('.isMarketOrder', () => {
    describe('when order type is a MARKET order', () => {
      it('returns true', () => {
        const order = Factory('exchangeOrder').build({ type: ExchangeOrder.types.MARKET })
        expect(ExchangeOrder.isMarketOrder(order)).to.eql(true)
      })
    })

    describe('when order type is not a MARKET order', () => {
      it('returns false', () => {
        const order = Factory('exchangeOrder').build({
          type: ExchangeOrder.types.LIMIT,
          baseQuantity: 100,
          quoteQuantity: 10000,
          price: 100
        })

        expect(ExchangeOrder.isMarketOrder(order)).to.eql(false)
      })
    })
  })

  describe('.isLimitOrder', () => {
    describe('when order type is a LIMIT order', () => {
      it('returns true', () => {
        const order = Factory('exchangeOrder').build({
          type: ExchangeOrder.types.LIMIT,
          baseQuantity: 100,
          quoteQuantity: 10000,
          price: 100
        })

        expect(ExchangeOrder.isLimitOrder(order)).to.eql(true)
      })
    })

    describe('when order type is not a LIMIT order', () => {
      it('returns false', () => {
        const order = Factory('exchangeOrder').build({ type: ExchangeOrder.types.MARKET })

        expect(ExchangeOrder.isLimitOrder(order)).to.eql(false)
      })
    })
  })
})
