const { expect, chance, BigNumber, behaviours } = require('../helpers')

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
      behaviours.throwsValidationError('is required', {
        check: () => (new Market({ ...defaultParams, symbol: undefined })),
        expect: error => expect(error.data[0].message).to.eql('symbol is required')
      })

      behaviours.throwsValidationError('must be a string', {
        check: () => (new Market({ ...defaultParams, symbol: chance.bool() })),
        expect: error => expect(error.data[0].message).to.eql('symbol must be a string')
      })
    })

    describe('base', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Market({ ...defaultParams, base: undefined })),
        expect: error => expect(error.data[0].message).to.eql('base is required')
      })

      behaviours.throwsValidationError('must be a string', {
        check: () => (new Market({ ...defaultParams, base: chance.bool() })),
        expect: error => expect(error.data[0].message).to.eql('base must be a string')
      })
    })

    describe('quote', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Market({ ...defaultParams, quote: undefined })),
        expect: error => expect(error.data[0].message).to.eql('quote is required')
      })

      behaviours.throwsValidationError('must be a string', {
        check: () => (new Market({ ...defaultParams, quote: chance.bool() })),
        expect: error => expect(error.data[0].message).to.eql('quote must be a string')
      })
    })

    describe('fees', () => {
      behaviours.throwsValidationError('must be an object', {
        check: () => (new Market({ ...defaultParams, fees: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('fees must be an Object')
      })

      describe('props', () => {
        describe('maker', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Market({ ...defaultParams, fees: { maker: 'twenty' } })),
            expect: error => expect(error.data[0].message).to.eql('fees.maker must be a number')
          })

          behaviours.throwsValidationError('must be greater than 0', {
            check: () => (new Market({ ...defaultParams, fees: { maker: -1 } })),
            expect: error => expect(error.data[0].message).to.eql('fees.maker must be greater than or equal to 0')
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
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Market({ ...defaultParams, fees: { taker: 'twenty' } })),
            expect: error => expect(error.data[0].message).to.eql('fees.taker must be a number')
          })

          behaviours.throwsValidationError('must be greater than 0', {
            check: () => (new Market({ ...defaultParams, fees: { taker: -1 } })),
            expect: error => expect(error.data[0].message).to.eql('fees.taker must be greater than or equal to 0')
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
      behaviours.throwsValidationError('must be an object', {
        check: () => (new Market({ ...defaultParams, precision: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('precision must be an Object')
      })

      describe('props', () => {
        describe('base', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Market({ ...defaultParams, precision: { base: 'twenty' } })),
            expect: error => expect(error.data[0].message).to.eql('precision.base must be a number')
          })

          behaviours.throwsValidationError('must be greater than 0', {
            check: () => (new Market({ ...defaultParams, precision: { base: -1 } })),
            expect: error => expect(error.data[0].message).to.eql('precision.base must be greater than or equal to 0')
          })

          it('defaults to 8', () => {
            const market = new Market({ ...defaultParams, precision: { base: undefined } })

            expect(market.precision.base).to.eql(8)
          })
        })

        describe('price', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Market({ ...defaultParams, precision: { price: 'twenty' } })),
            expect: error => expect(error.data[0].message).to.eql('precision.price must be a number')
          })

          behaviours.throwsValidationError('must be greater than 0', {
            check: () => (new Market({ ...defaultParams, precision: { price: -1 } })),
            expect: error => expect(error.data[0].message).to.eql('precision.price must be greater than or equal to 0')
          })

          it('defaults to 2', () => {
            const market = new Market({ ...defaultParams, precision: { price: undefined } })

            expect(market.precision.price).to.eql(2)
          })
        })

        describe('quote', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Market({ ...defaultParams, precision: { quote: 'twenty' } })),
            expect: error => expect(error.data[0].message).to.eql('precision.quote must be a number')
          })

          behaviours.throwsValidationError('must be greater than 0', {
            check: () => (new Market({ ...defaultParams, precision: { quote: -1 } })),
            expect: error => expect(error.data[0].message).to.eql('precision.quote must be greater than or equal to 0')
          })

          it('defaults to 8', () => {
            const market = new Market({ ...defaultParams, precision: { quote: undefined } })

            expect(market.precision.quote).to.eql(8)
          })
        })

        describe('amount', () => {
          behaviours.throwsValidationError('must be a number', {
            check: () => (new Market({ ...defaultParams, precision: { amount: 'twenty' } })),
            expect: error => expect(error.data[0].message).to.eql('precision.amount must be a number')
          })

          behaviours.throwsValidationError('must be greater than 0', {
            check: () => (new Market({ ...defaultParams, precision: { amount: -1 } })),
            expect: error => expect(error.data[0].message).to.eql('precision.amount must be greater than or equal to 0')
          })

          it('defaults to 5', () => {
            const market = new Market({ ...defaultParams, precision: { amount: undefined } })

            expect(market.precision.amount).to.eql(5)
          })
        })
      })
    })

    describe('limits', () => {
      behaviours.throwsValidationError('must be an object', {
        check: () => (new Market({ ...defaultParams, limits: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('limits must be an Object')
      })

      describe('props', () => {
        describe('amount', () => {
          behaviours.throwsValidationError('must be an object', {
            check: () => (new Market({ ...defaultParams, limits: { amount: chance.string() } })),
            expect: error => expect(error.data[0].message).to.eql('limits.amount must be an Object')
          })

          describe('props', () => {
            describe('min', () => {
              behaviours.throwsValidationError('must be a number', {
                check: () => (new Market({ ...defaultParams, limits: { amount: { min: 'twenty' } } })),
                expect: error => expect(error.data[0].message).to.eql('limits.amount.min must be a number')
              })

              behaviours.throwsValidationError('must be greater than 0', {
                check: () => (new Market({ ...defaultParams, limits: { amount: { min: -1 } } })),
                expect: error => expect(error.data[0].message).to.eql('limits.amount.min must be greater than or equal to 0')
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
              behaviours.throwsValidationError('must be a number', {
                check: () => (new Market({ ...defaultParams, limits: { amount: { max: 'twenty' } } })),
                expect: error => expect(error.data[0].message).to.eql('limits.amount.max must be a number')
              })

              behaviours.throwsValidationError('must be greater than 0', {
                check: () => (new Market({ ...defaultParams, limits: { amount: { max: -1 } } })),
                expect: error => expect(error.data[0].message).to.eql('limits.amount.max must be greater than or equal to 0')
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
          behaviours.throwsValidationError('must be an object', {
            check: () => (new Market({ ...defaultParams, limits: { cost: chance.string() } })),
            expect: error => expect(error.data[0].message).to.eql('limits.cost must be an Object')
          })

          describe('props', () => {
            describe('min', () => {
              behaviours.throwsValidationError('must be a number', {
                check: () => (new Market({ ...defaultParams, limits: { cost: { min: 'twenty' } } })),
                expect: error => expect(error.data[0].message).to.eql('limits.cost.min must be a number')
              })

              behaviours.throwsValidationError('must be greater than 0', {
                check: () => (new Market({ ...defaultParams, limits: { cost: { min: -1 } } })),
                expect: error => expect(error.data[0].message).to.eql('limits.cost.min must be greater than or equal to 0')
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
              behaviours.throwsValidationError('must be a number', {
                check: () => (new Market({ ...defaultParams, limits: { cost: { max: 'twenty' } } })),
                expect: error => expect(error.data[0].message).to.eql('limits.cost.max must be a number')
              })

              behaviours.throwsValidationError('must be greater than 0', {
                check: () => (new Market({ ...defaultParams, limits: { cost: { max: -1 } } })),
                expect: error => expect(error.data[0].message).to.eql('limits.cost.max must be greater than or equal to 0')
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
