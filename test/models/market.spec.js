const { expect, chance, BigNumber } = require('../helpers')

const Market = require('../../lib/models/market')

describe('Market Model', () => {
  describe('params', () => {
    const defaultParams = {
      symbol: 'BTC/USDT',
      base: 'BTC',
      quote: 'USDT',
      fees: {
        maker: chance.floating({ min: 0.001, max: 0.01 }),
        taker: chance.floating({ min: 0.001, max: 0.01 })
      },
      precision: { base: 8, price: 2, quote: 8, amount: 5 },
      limits: {
        amount: {
          min: chance.integer({ min: 0, max: chance.floating({ min: 0, max: 0.00001 }) }),
          max: chance.integer({ min: 0, max: chance.integer({ min: 1, max: 1000 }) })
        },
        cost: {
          min: chance.integer({ min: 0, max: chance.integer({ min: 0, max: 10 }) }),
          max: chance.integer({ min: 0, max: chance.integer({ min: 10000, max: 100000 }) })
        }
      }
    }

    describe('symbol', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Market({ ...defaultParams, symbol: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('symbol is required')
      })

      it('must be a string', () => {
        let thrownErr = null

        try {
          new Market({ ...defaultParams, symbol: chance.bool() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('symbol must be a string')
      })
    })

    describe('base', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Market({ ...defaultParams, base: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('base is required')
      })

      it('must be a string', () => {
        let thrownErr = null

        try {
          new Market({ ...defaultParams, base: chance.bool() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('base must be a string')
      })
    })

    describe('quote', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Market({ ...defaultParams, quote: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quote is required')
      })

      it('must be a string', () => {
        let thrownErr = null

        try {
          new Market({ ...defaultParams, quote: chance.bool() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quote must be a string')
      })
    })

    describe('fees', () => {
      it('must be an object', () => {
        let thrownErr = null

        try {
          new Market({ ...defaultParams, fees: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('fees must be an Object')
      })

      describe('props', () => {
        describe('maker', () => {
          it('it must be a number', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, fees: { maker: 'twenty' } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('fees.maker must be a number')
          })

          it('must be greater than 0', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, fees: { maker: -1 } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('fees.maker must be greater than or equal to 0')
          })

          it('converts to BigNumber', () => {
            const market = new Market({ ...defaultParams })

            expect(market.fees.maker).to.eql(BigNumber(defaultParams.fees.maker).toFixed())
          })

          it('defaults to 0.001', () => {
            const market = new Market({ ...defaultParams, fees: { maker: undefined } })

            expect(market.fees.maker).to.eql('0.001')
          })
        })

        describe('taker', () => {
          it('it must be a number', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, fees: { taker: 'twenty' } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('fees.taker must be a number')
          })

          it('must be greater than 0', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, fees: { taker: -1 } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('fees.taker must be greater than or equal to 0')
          })

          it('converts to BigNumber', () => {
            const market = new Market({ ...defaultParams })

            expect(market.fees.taker).to.eql(BigNumber(defaultParams.fees.taker).toFixed())
          })

          it('defaults to 0.001', () => {
            const market = new Market({ ...defaultParams, fees: { taker: undefined } })

            expect(market.fees.taker).to.eql('0.001')
          })
        })
      })
    })

    describe('precision', () => {
      it('must be an object', () => {
        let thrownErr = null

        try {
          new Market({ ...defaultParams, precision: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('precision must be an Object')
      })

      describe('props', () => {
        describe('base', () => {
          it('it must be a number', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, precision: { base: 'twenty' } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('precision.base must be a number')
          })

          it('must be greater than 0', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, precision: { base: -1 } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('precision.base must be greater than or equal to 0')
          })

          it('defaults to 8', () => {
            const market = new Market({ ...defaultParams, precision: { base: undefined } })

            expect(market.precision.base).to.eql(8)
          })
        })

        describe('price', () => {
          it('it must be a number', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, precision: { price: 'twenty' } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('precision.price must be a number')
          })

          it('must be greater than 0', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, precision: { price: -1 } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('precision.price must be greater than or equal to 0')
          })

          it('defaults to 2', () => {
            const market = new Market({ ...defaultParams, precision: { price: undefined } })

            expect(market.precision.price).to.eql(2)
          })
        })

        describe('quote', () => {
          it('it must be a number', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, precision: { quote: 'twenty' } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('precision.quote must be a number')
          })

          it('must be greater than 0', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, precision: { quote: -1 } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('precision.quote must be greater than or equal to 0')
          })

          it('defaults to 8', () => {
            const market = new Market({ ...defaultParams, precision: { quote: undefined } })

            expect(market.precision.quote).to.eql(8)
          })
        })

        describe('amount', () => {
          it('it must be a number', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, precision: { amount: 'twenty' } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('precision.amount must be a number')
          })

          it('must be greater than 0', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, precision: { amount: -1 } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('precision.amount must be greater than or equal to 0')
          })

          it('defaults to 5', () => {
            const market = new Market({ ...defaultParams, precision: { amount: undefined } })

            expect(market.precision.amount).to.eql(5)
          })
        })
      })
    })

    describe('limits', () => {
      it('must be an object', () => {
        let thrownErr = null

        try {
          new Market({ ...defaultParams, limits: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('limits must be an Object')
      })

      describe('props', () => {
        describe('amount', () => {
          it('must be an object', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, limits: { amount: chance.string() } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('limits.amount must be an Object')
          })

          describe('props', () => {
            describe('min', () => {
              it('it must be a number', () => {
                let thrownErr = null

                try {
                  new Market({ ...defaultParams, limits: { amount: { min: 'twenty' } } }) /* eslint-disable-line no-new */
                } catch (err) {
                  thrownErr = err
                }

                expect(thrownErr.type).to.eql('VALIDATION_ERROR')
                expect(thrownErr.data[0].message).to.eql('limits.amount.min must be a number')
              })

              it('must be greater than 0', () => {
                let thrownErr = null

                try {
                  new Market({ ...defaultParams, limits: { amount: { min: -1 } } }) /* eslint-disable-line no-new */
                } catch (err) {
                  thrownErr = err
                }

                expect(thrownErr.type).to.eql('VALIDATION_ERROR')
                expect(thrownErr.data[0].message).to.eql('limits.amount.min must be greater than or equal to 0')
              })

              it('converts to BigNumber', () => {
                const market = new Market({ ...defaultParams })

                expect(market.limits.amount.min).to.eql(BigNumber(defaultParams.limits.amount.min).toFixed())
              })

              it('defaults to 0.000001', () => {
                const market = new Market({ ...defaultParams, limits: { amount: {} } })

                expect(market.limits.amount.min).to.eql('0.000001')
              })
            })

            describe('max', () => {
              it('it must be a number', () => {
                let thrownErr = null

                try {
                  new Market({ ...defaultParams, limits: { amount: { max: 'twenty' } } }) /* eslint-disable-line no-new */
                } catch (err) {
                  thrownErr = err
                }

                expect(thrownErr.type).to.eql('VALIDATION_ERROR')
                expect(thrownErr.data[0].message).to.eql('limits.amount.max must be a number')
              })

              it('must be greater than 0', () => {
                let thrownErr = null

                try {
                  new Market({ ...defaultParams, limits: { amount: { max: -1 } } }) /* eslint-disable-line no-new */
                } catch (err) {
                  thrownErr = err
                }

                expect(thrownErr.type).to.eql('VALIDATION_ERROR')
                expect(thrownErr.data[0].message).to.eql('limits.amount.max must be greater than or equal to 0')
              })

              it('converts to BigNumber', () => {
                const market = new Market({ ...defaultParams })

                expect(market.limits.amount.max).to.eql(BigNumber(defaultParams.limits.amount.max).toFixed())
              })

              it('defaults to 100000', () => {
                const market = new Market({ ...defaultParams, limits: { amount: {} } })

                expect(market.limits.amount.max).to.eql('100000')
              })
            })
          })
        })

        describe('cost', () => {
          it('must be an object', () => {
            let thrownErr = null

            try {
              new Market({ ...defaultParams, limits: { cost: chance.string() } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('limits.cost must be an Object')
          })

          describe('props', () => {
            describe('min', () => {
              it('it must be a number', () => {
                let thrownErr = null

                try {
                  new Market({ ...defaultParams, limits: { cost: { min: 'twenty' } } }) /* eslint-disable-line no-new */
                } catch (err) {
                  thrownErr = err
                }

                expect(thrownErr.type).to.eql('VALIDATION_ERROR')
                expect(thrownErr.data[0].message).to.eql('limits.cost.min must be a number')
              })

              it('must be greater than 0', () => {
                let thrownErr = null

                try {
                  new Market({ ...defaultParams, limits: { cost: { min: -1 } } }) /* eslint-disable-line no-new */
                } catch (err) {
                  thrownErr = err
                }

                expect(thrownErr.type).to.eql('VALIDATION_ERROR')
                expect(thrownErr.data[0].message).to.eql('limits.cost.min must be greater than or equal to 0')
              })

              it('converts to BigNumber', () => {
                const market = new Market({ ...defaultParams })

                expect(market.limits.cost.min).to.eql(BigNumber(defaultParams.limits.cost.min).toFixed())
              })

              it('defaults to 10', () => {
                const market = new Market({ ...defaultParams, limits: { cost: {} } })

                expect(market.limits.cost.min).to.eql('10')
              })
            })

            describe('max', () => {
              it('it must be a number', () => {
                let thrownErr = null

                try {
                  new Market({ ...defaultParams, limits: { cost: { max: 'twenty' } } }) /* eslint-disable-line no-new */
                } catch (err) {
                  thrownErr = err
                }

                expect(thrownErr.type).to.eql('VALIDATION_ERROR')
                expect(thrownErr.data[0].message).to.eql('limits.cost.max must be a number')
              })

              it('must be greater than 0', () => {
                let thrownErr = null

                try {
                  new Market({ ...defaultParams, limits: { cost: { max: -1 } } }) /* eslint-disable-line no-new */
                } catch (err) {
                  thrownErr = err
                }

                expect(thrownErr.type).to.eql('VALIDATION_ERROR')
                expect(thrownErr.data[0].message).to.eql('limits.cost.max must be greater than or equal to 0')
              })

              it('converts to BigNumber', () => {
                const market = new Market({ ...defaultParams })

                expect(market.limits.cost.max).to.eql(BigNumber(defaultParams.limits.cost.max).toFixed())
              })

              it('defaults to 100000', () => {
                const market = new Market({ ...defaultParams, limits: { cost: {} } })

                expect(market.limits.cost.max).to.eql('100000')
              })
            })
          })
        })
      })
    })
  })
})
