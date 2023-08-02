const { expect, chance } = require('../helpers')

const Trade = require('../../lib/models/trade')

describe('Trade Model', () => {
  describe('params', () => {
    const defaultParams = {
      id: chance.guid({ version: 4 }),
      foreignId: chance.guid({ version: 4 }),
      baseQuantityGross: chance.floating({ min: 0, max: 100 }),
      baseQuantityNet: chance.floating({ min: 0, max: 100 }),
      quoteQuantityGross: chance.floating({ min: 0, max: 100 }),
      quoteQuantityNet: chance.floating({ min: 0, max: 100 }),
      price: chance.floating({ min: 0, max: 100 }),
      fee: {
        currency: chance.string({ alpha: true, length: 3, casing: 'upper' }),
        cost: chance.floating({ min: 0.01, max: 2.00 })
      }
    }

    describe('id', () => {
      it('must be a UUID', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, id: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('id must be a valid UUID')
      })

      it('defaults to a UUID', () => {
        const model = new Trade({ ...defaultParams, id: undefined })

        expect(model.id).be.a.uuid('v4')
      })
    })

    describe('foreignId', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, foreignId: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('foreignId is required')
      })

      it('must be a UUID', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, foreignId: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('foreignId must be a valid UUID')
      })
    })

    describe('baseQuantityGross', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, baseQuantityGross: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantityGross is required')
      })

      it('must be a number', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, baseQuantityGross: 'twenty' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantityGross must be a number')
      })
    })

    describe('baseQuantityNet', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, baseQuantityNet: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantityNet is required')
      })

      it('must be a number', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, baseQuantityNet: 'twenty' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('baseQuantityNet must be a number')
      })
    })

    describe('quoteQuantityGross', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, quoteQuantityGross: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantityGross is required')
      })

      it('must be a number', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, quoteQuantityGross: 'twenty' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantityGross must be a number')
      })
    })

    describe('quoteQuantityNet', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, quoteQuantityNet: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantityNet is required')
      })

      it('must be a number', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, quoteQuantityNet: 'twenty' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('quoteQuantityNet must be a number')
      })
    })

    describe('price', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, price: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('price is required')
      })

      it('must be a number', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, price: 'twenty' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('price must be a number')
      })
    })

    describe('fee', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, fee: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('fee is required')
      })

      it('must be an object', () => {
        let thrownErr = null

        try {
          new Trade({ ...defaultParams, fee: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('fee must be an Object')
      })

      describe('props', () => {
        describe('currency', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              new Trade({ ...defaultParams, fee: { ...defaultParams.fee, currency: undefined } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('fee.currency is required')
          })

          it('must be a string', () => {
            let thrownErr = null

            try {
              new Trade({ ...defaultParams, fee: { ...defaultParams.fee, currency: chance.integer({ max: -1 }) } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('fee.currency must be a string')
          })
        })

        describe('cost', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              new Trade({ ...defaultParams, fee: { ...defaultParams.fee, cost: undefined } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('fee.cost is required')
          })

          it('must be a number', () => {
            let thrownErr = null

            try {
              new Trade({ ...defaultParams, fee: { ...defaultParams.fee, cost: 'twenty' } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('fee.cost must be a number')
          })
        })
      })
    })
  })
})
