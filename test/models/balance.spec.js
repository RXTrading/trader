const { expect, chance, behaviours } = require('../helpers')

const Balance = require('../../lib/models/balance')

describe('Balance Model', () => {
  describe('params', () => {
    const defaultParams = {
      symbol: chance.pickone(['BTC', 'USDT']),
      free: chance.integer({ min: 500, max: 1000 }),
      used: chance.integer({ min: 0, max: 500 }),
      total: chance.integer({ min: 0, max: 1000 })
    }

    describe('symbol', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Balance({ ...defaultParams, symbol: undefined })),
        expect: error => expect(error.data[0].message).to.eql('symbol is required')
      })

      behaviours.throwsValidationError('is required', {
        check: () => (new Balance({ ...defaultParams, symbol: chance.bool() })),
        expect: error => expect(error.data[0].message).to.eql('symbol must be a string')
      })
    })

    describe('free', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Balance({ ...defaultParams, free: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('free must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new Balance({ ...defaultParams, free: -1 })),
        expect: error => expect(error.data[0].message).to.eql('free must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Balance({ ...defaultParams, free: undefined })

        expect(model.free).not.to.be.null()
        expect(model.free).be.eql('0')
      })
    })

    describe('used', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Balance({ ...defaultParams, used: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('used must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new Balance({ ...defaultParams, used: -1 })),
        expect: error => expect(error.data[0].message).to.eql('used must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Balance({ ...defaultParams, used: undefined })

        expect(model.used).not.to.be.null()
        expect(model.used).be.eql('0')
      })
    })

    describe('total', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new Balance({ ...defaultParams, total: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('total must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new Balance({ ...defaultParams, total: -1 })),
        expect: error => expect(error.data[0].message).to.eql('total must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Balance({ ...defaultParams, total: undefined })

        expect(model.total).not.to.be.null()
        expect(model.total).be.eql('0')
      })
    })
  })
})
