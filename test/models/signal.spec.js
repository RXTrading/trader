const { expect, chance } = require('../helpers')

const Signal = require('../../lib/models/signal')

describe('Signal Model', () => {
  it('has statuses', () => {
    expect(Signal.statuses).to.eql({
      NEW: 'NEW',
      PROCESSING: 'PROCESSING',
      ACCEPTED: 'ACCEPTED',
      REJECTED: 'REJECTED',
      EXPIRED: 'EXPIRED'
    })
  })

  it('has types', () => {
    expect(Signal.types).to.eql({
      OPEN_POSITION: 'OPEN_POSITION',
      CLOSE_POSITION: 'CLOSE_POSITION',
      CLOSE_ALL_POSITIONS: 'CLOSE_ALL_POSITIONS'
    })
  })

  describe('params', () => {
    const defaultParams = {
      id: chance.guid({ version: 4 }),
      timestamp: chance.date(),
      status: chance.pickone(Object.values(Signal.statuses)),
      type: chance.pickone(Object.values(Signal.types)),
      params: {},
      rule: {}
    }

    describe('id', () => {
      it('must be a UUID', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, id: 'random-id' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('id must be a valid UUID')
      })

      it('defaults to a UUID', () => {
        const model = new Signal({ ...defaultParams, id: undefined })

        expect(model.id).be.a.uuid('v4')
      })
    })

    describe('timestamp', () => {
      it('must be a date', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, timestamp: 'tomorrow' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('timestamp must be a Date')
      })

      it('defaults to current time', () => {
        const model = new Signal({ ...defaultParams, timestamp: undefined })

        expect(model.timestamp).not.to.be.null()
        expect(model.timestamp).be.closeToTime(new Date(), 1)
      })
    })

    describe('type', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, type: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('type is required')
      })

      it('must match', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, type: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql(
          `type must match one of ${Object.values(Signal.types).join(', ')}`
        )
      })
    })

    describe('status', () => {
      it('must match', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, status: chance.string({ max: 5, aplha: true }) }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql(
          `status must match one of ${Object.values(Signal.statuses).join(', ')}`
        )
      })

      it('defaults to NEW', () => {
        const model = new Signal({ ...defaultParams, status: undefined })

        expect(model.status).not.to.be.null()
        expect(model.status).be.eql(Signal.statuses.NEW)
      })
    })

    describe('params', () => {
      it('must be an object', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, params: chance.integer() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('params must be an Object')
      })

      it('defaults to an empty object', () => {
        const model = new Signal({ ...defaultParams, params: undefined })

        expect(model.params).to.eql({})
      })
    })

    describe('rule', () => {
      it('must be an object', () => {
        let thrownErr = null

        try {
          new Signal({ ...defaultParams, rule: chance.integer() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('rule must be an Object')
      })

      it('defaults to an empty object', () => {
        const model = new Signal({ ...defaultParams, rule: undefined })

        expect(model.rule).to.eql({})
      })
    })
  })
})
