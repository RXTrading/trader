const { expect, chance, behaviours } = require('../helpers')

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
      behaviours.throwsValidationError('must be a UUID', {
        check: () => (new Trade({ ...defaultParams, id: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('id must be a valid UUID')
      })

      it('defaults to a UUID', () => {
        const model = new Trade({ ...defaultParams, id: undefined })

        expect(model.id).be.a.uuid('v4')
      })
    })

    describe('foreignId', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Trade({ ...defaultParams, foreignId: undefined })),
        expect: error => expect(error.data[0].message).to.eql('foreignId is required')
      })

      behaviours.throwsValidationError('must be a UUID', {
        check: () => (new Trade({ ...defaultParams, foreignId: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('foreignId must be a valid UUID')
      })
    })

    describe('baseQuantityGross', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Trade({ ...defaultParams, baseQuantityGross: undefined })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantityGross is required')
      })

      behaviours.throwsValidationError('must be a number', {
        check: () => (new Trade({ ...defaultParams, baseQuantityGross: 'twenty' })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantityGross must be a number')
      })
    })

    describe('baseQuantityNet', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Trade({ ...defaultParams, baseQuantityNet: undefined })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantityNet is required')
      })

      behaviours.throwsValidationError('must be a number', {
        check: () => (new Trade({ ...defaultParams, baseQuantityNet: 'twenty' })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantityNet must be a number')
      })
    })

    describe('quoteQuantityGross', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Trade({ ...defaultParams, quoteQuantityGross: undefined })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantityGross is required')
      })

      behaviours.throwsValidationError('must be a number', {
        check: () => (new Trade({ ...defaultParams, quoteQuantityGross: 'twenty' })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantityGross must be a number')
      })
    })

    describe('quoteQuantityNet', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Trade({ ...defaultParams, quoteQuantityNet: undefined })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantityNet is required')
      })

      behaviours.throwsValidationError('must be a number', {
        check: () => (new Trade({ ...defaultParams, quoteQuantityNet: 'twenty' })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantityNet must be a number')
      })
    })

    describe('price', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Trade({ ...defaultParams, price: undefined })),
        expect: error => expect(error.data[0].message).to.eql('price is required')
      })

      behaviours.throwsValidationError('must be a number', {
        check: () => (new Trade({ ...defaultParams, price: 'twenty' })),
        expect: error => expect(error.data[0].message).to.eql('price must be a number')
      })
    })

    describe('fee', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Trade({ ...defaultParams, fee: undefined })),
        expect: error => expect(error.data[0].message).to.eql('fee is required')
      })

      behaviours.throwsValidationError('must be an object', {
        check: () => (new Trade({ ...defaultParams, fee: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('fee must be an Object')
      })

      describe('props', () => {
        describe('currency', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (new Trade({ ...defaultParams, fee: { ...defaultParams.fee, currency: undefined } })),
            expect: error => expect(error.data[0].message).to.eql('fee.currency is required')
          })

          behaviours.throwsValidationError('must be a string', {
            check: () => (new Trade({ ...defaultParams, fee: { ...defaultParams.fee, currency: chance.integer({ max: -1 }) } })),
            expect: error => expect(error.data[0].message).to.eql('fee.currency must be a string')
          })
        })

        describe('cost', () => {
          behaviours.throwsValidationError('is required', {
            check: () => (new Trade({ ...defaultParams, fee: { ...defaultParams.fee, cost: undefined } })),
            expect: error => expect(error.data[0].message).to.eql('fee.cost is required')
          })

          behaviours.throwsValidationError('must be a number', {
            check: () => (new Trade({ ...defaultParams, fee: { ...defaultParams.fee, cost: 'twenty' } })),
            expect: error => expect(error.data[0].message).to.eql('fee.cost must be a number')
          })
        })
      })
    })
  })
})
