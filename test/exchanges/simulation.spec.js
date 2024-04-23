const { expect, behaviours, chance, BigNumber, moment } = require('../helpers')

const Exchange = require('../../lib/exchanges/simulation')

describe('Exchanges: Simulation', () => {
  describe('#setTick', () => {
    const exchange = new Exchange()

    describe('tick', () => {
      behaviours.throwsValidationError('is required', {
        check: () => exchange.setTick(),
        expect: error => expect(error.data[0].message).to.eql('tick is required')
      })

      behaviours.throwsValidationError('must be a number', {
        check: () => exchange.setTick('twenty'),
        expect: error => expect(error.data[0].message).to.eql('tick must be a number')
      })
    })

    it('sets the current tick', () => {
      const tick = chance.integer({ min: 0, max: 1000 })

      expect(exchange.getTick()).to.eql(undefined)
      exchange.setTick(tick)
      expect(exchange.getTick()).to.eql(BigNumber(tick).toFixed())
    })
  })

  describe('#setCandle', () => {
    const exchange = new Exchange()
    const timestamp = moment().utc().subtract(5, 'minutes').toDate()
    const defaultParams = {
      timestamp,
      open: chance.floating({ min: 0.00, max: 10.00 }),
      high: chance.floating({ min: 0.00, max: 10.00 }),
      low: chance.floating({ min: 0.00, max: 10.00 }),
      close: chance.floating({ min: 0.00, max: 10.00 })
    }

    describe('candle', () => {
      behaviours.throwsValidationError('is required', {
        check: () => exchange.setCandle(),
        expect: error => expect(error.data[0].message).to.eql('candle.timestamp is required')
      })

      behaviours.throwsValidationError('must be an object', {
        check: () => exchange.setCandle(chance.string()),
        expect: error => expect(error.data[0].message).to.eql('candle must be an Object')
      })

      describe('props', () => {
        describe('timestamp', () => {
          behaviours.throwsValidationError('is required', {
            check: () => exchange.setCandle({ ...defaultParams, timestamp: undefined }),
            expect: error => expect(error.data[0].message).to.eql('candle.timestamp is required')
          })

          behaviours.throwsValidationError('must be a date', {
            check: () => exchange.setCandle({ ...defaultParams, timestamp: 'tomorrow' }),
            expect: error => expect(error.data[0].message).to.eql('candle.timestamp must be a Date')
          })
        })

        describe('open', () => {
          behaviours.throwsValidationError('must be an object', {
            check: () => exchange.setCandle({ ...defaultParams, open: undefined }),
            expect: error => expect(error.data[0].message).to.eql('candle.open is required')
          })

          behaviours.throwsValidationError('must be a number', {
            check: () => exchange.setCandle({ ...defaultParams, open: 'twenty' }),
            expect: error => expect(error.data[0].message).to.eql('candle.open must be a number')
          })
        })

        describe('high', () => {
          behaviours.throwsValidationError('must be an object', {
            check: () => exchange.setCandle({ ...defaultParams, high: undefined }),
            expect: error => expect(error.data[0].message).to.eql('candle.high is required')
          })

          behaviours.throwsValidationError('must be a number', {
            check: () => exchange.setCandle({ ...defaultParams, high: 'twenty' }),
            expect: error => expect(error.data[0].message).to.eql('candle.high must be a number')
          })
        })

        describe('low', () => {
          behaviours.throwsValidationError('must be an object', {
            check: () => exchange.setCandle({ ...defaultParams, low: undefined }),
            expect: error => expect(error.data[0].message).to.eql('candle.low is required')
          })

          behaviours.throwsValidationError('must be a number', {
            check: () => exchange.setCandle({ ...defaultParams, low: 'twenty' }),
            expect: error => expect(error.data[0].message).to.eql('candle.low must be a number')
          })
        })

        describe('close', () => {
          behaviours.throwsValidationError('must be an object', {
            check: () => exchange.setCandle({ ...defaultParams, close: undefined }),
            expect: error => expect(error.data[0].message).to.eql('candle.close is required')
          })

          behaviours.throwsValidationError('must be a number', {
            check: () => exchange.setCandle({ ...defaultParams, close: 'twenty' }),
            expect: error => expect(error.data[0].message).to.eql('candle.close must be a number')
          })
        })
      })
    })

    it('sets the current candle', () => {
      const candle = {
        timestamp,
        open: chance.floating({ min: 0.00, max: 10.00 }),
        high: chance.floating({ min: 0.00, max: 10.00 }),
        low: chance.floating({ min: 0.00, max: 10.00 }),
        close: chance.floating({ min: 0.00, max: 10.00 })
      }

      expect(exchange.getCandle()).to.eql(undefined)

      exchange.setCandle(candle)

      expect(exchange.getCandle()).to.eql({
        timestamp,
        open: BigNumber(candle.open).toFixed(),
        high: BigNumber(candle.high).toFixed(),
        low: BigNumber(candle.low).toFixed(),
        close: BigNumber(candle.close).toFixed()
      })
    })
  })
})
