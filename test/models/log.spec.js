const { expect, chance, behaviours } = require('../helpers')

const Log = require('../../lib/models/log')

describe('Log Model', () => {
  describe('params', () => {
    const defaultParams = {
      timestamp: chance.date(),
      type: chance.pickone(['info', 'success', 'warning', 'error']),
      code: chance.string({ max: 5, aplha: true }),
      data: {}
    }

    describe('timestamp', () => {
      behaviours.throwsValidationError('must be a date', {
        check: () => (new Log({ ...defaultParams, timestamp: 'tomorrow' })),
        expect: error => expect(error.data[0].message).to.eql('timestamp must be a Date')
      })

      it('defaults to current time', () => {
        const model = new Log({ ...defaultParams, timestamp: undefined })

        expect(model.timestamp).not.to.be.null()
        expect(model.timestamp).be.closeToTime(new Date(), 1)
      })
    })

    describe('type', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Log({ ...defaultParams, type: undefined })),
        expect: error => expect(error.data[0].message).to.eql('type is required')
      })

      behaviours.throwsValidationError('must match one of info, success, warning, error', {
        check: () => (new Log({ ...defaultParams, type: chance.string({ max: 5, aplha: true }) })),
        expect: error => expect(error.data[0].message).to.eql('type must match one of info, success, warning, error')
      })
    })

    describe('code', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new Log({ ...defaultParams, code: undefined })),
        expect: error => expect(error.data[0].message).to.eql('code is required')
      })

      behaviours.throwsValidationError('must be a string', {
        check: () => (new Log({ ...defaultParams, code: chance.integer() })),
        expect: error => expect(error.data[0].message).to.eql('code must be a string')
      })
    })

    describe('data', () => {
      behaviours.throwsValidationError('must be an object', {
        check: () => (new Log({ ...defaultParams, data: chance.integer() })),
        expect: error => expect(error.data[0].message).to.eql('data must be an Object')
      })

      it('defaults to an empty object', () => {
        const model = new Log({ ...defaultParams, data: undefined })

        expect(model.data).to.eql({})
      })
    })
  })
})
