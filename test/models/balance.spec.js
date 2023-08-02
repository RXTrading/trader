const { expect, chance } = require('../helpers')

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
      it('is required', () => {
        let thrownErr = null

        try {
          new Balance({ ...defaultParams, symbol: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('symbol is required')
      })

      it('must be a string', () => {
        let thrownErr = null

        try {
          new Balance({ ...defaultParams, symbol: chance.bool() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('symbol must be a string')
      })
    })

    describe('free', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Balance({ ...defaultParams, free: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('free must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new Balance({ ...defaultParams, free: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('free must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Balance({ ...defaultParams, free: undefined })

        expect(model.free).not.to.be.null()
        expect(model.free).be.eql('0')
      })
    })

    describe('used', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Balance({ ...defaultParams, used: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('used must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new Balance({ ...defaultParams, used: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('used must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Balance({ ...defaultParams, used: undefined })

        expect(model.used).not.to.be.null()
        expect(model.used).be.eql('0')
      })
    })

    describe('total', () => {
      it('must be a number', () => {
        let thrownErr = null

        try {
          new Balance({ ...defaultParams, total: 'seventy' }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('total must be a number')
      })

      it('must be greater than or equal to 0', () => {
        let thrownErr = null

        try {
          new Balance({ ...defaultParams, total: -1 }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('total must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new Balance({ ...defaultParams, total: undefined })

        expect(model.total).not.to.be.null()
        expect(model.total).be.eql('0')
      })
    })
  })
})
