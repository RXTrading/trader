const { expect, chance } = require('../helpers')

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
      it('must be a date', () => {
        let thrownErr = null

        try {
          new Log({ ...defaultParams, timestamp: 'tomorrow' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('timestamp must be a Date')
      })

      it('defaults to current time', () => {
        const model = new Log({ ...defaultParams, timestamp: undefined })

        expect(model.timestamp).not.to.be.null()
        expect(model.timestamp).be.closeToTime(new Date(), 1)
      })
    })

    describe('type', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Log({ ...defaultParams, type: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('type is required')
      })

      it('must match one of info, success, warning, error', () => {
        let thrownErr = null

        try {
          new Log({ ...defaultParams, type: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('type must match one of info, success, warning, error')
      })
    })

    describe('code', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Log({ ...defaultParams, code: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('code is required')
      })

      it('must be a string', () => {
        let thrownErr = null

        try {
          new Log({ ...defaultParams, code: chance.integer() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('code must be a string')
      })
    })

    describe('data', () => {
      it('must be an object', () => {
        let thrownErr = null

        try {
          new Log({ ...defaultParams, data: chance.integer() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('data must be an Object')
      })

      it('defaults to an empty object', () => {
        const model = new Log({ ...defaultParams, data: undefined })

        expect(model.data).to.eql({})
      })
    })
  })
})
