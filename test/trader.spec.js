const { expect, Factory, behaviours, chance } = require('./helpers')

const Trader = require('../lib/trader')
const Exchange = require('../lib/exchanges/simulation')

describe('Trader', () => {
  describe('options', () => {
    const defaultParams = {
      exchange: {},
      positions: [],
      backtest: chance.bool()
    }

    describe('exchange', () => {
      behaviours.throwsTraderValidationError('is required', {
        check: () => (new Trader({ ...defaultParams, exchange: undefined })),
        expect: error => expect(error.data[0].message).to.eql('exchange is required')
      })

      behaviours.throwsTraderValidationError('must be an object', {
        check: () => (new Trader({ ...defaultParams, exchange: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('exchange must be an Object')
      })
    })

    describe('positions', () => {
      behaviours.throwsTraderValidationError('must be an array', {
        check: () => (new Trader({ ...defaultParams, positions: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('positions must be an array')
      })

      describe('items', () => {
        behaviours.throwsTraderValidationError('must be an instance of Position', {
          check: () => (new Trader({ ...defaultParams, positions: [chance.string()] })),
          expect: error => expect(error.data[0].message).to.eql('positions[0] must be an instance of the Position class')
        })
      })
    })

    describe('backtest', () => {
      behaviours.throwsTraderValidationError('must be boolean', {
        check: () => (new Trader({ ...defaultParams, backtest: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('backtest must be a boolean')
      })
    })
  })

  describe('#exchange', () => {
    it('returns the provided exchange', () => {
      const exchange = new Exchange()
      const trader = new Trader({ exchange })

      expect(trader.exchange).to.eql(exchange)
    })
  })

  describe('#positions', () => {
    it('returns positions', () => {
      const positions = [
        Factory('position').build(),
        Factory('position').build()
      ]

      const exchange = new Exchange()
      const trader = new Trader({ exchange, positions })

      expect(trader.positions).to.eql(positions)
    })
  })
})
