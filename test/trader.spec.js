const { expect, Factory, chance } = require('./helpers')

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
      it('is required', () => {
        let thrownErr = null

        try {
          new Trader({ ...defaultParams, exchange: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('TRADER_VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('exchange is required')
      })

      it('must be an Object', () => {
        let thrownErr = null

        try {
          new Trader({ ...defaultParams, exchange: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('TRADER_VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('exchange must be an Object')
      })
    })

    describe('positions', () => {
      it('must be an array', () => {
        let thrownErr = null

        try {
          new Trader({ ...defaultParams, positions: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('TRADER_VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('positions must be an array')
      })

      describe('items', () => {
        it('must be an instance of Position', () => {
          let thrownErr = null

          try {
            new Trader({ ...defaultParams, positions: [chance.string()] }) /* eslint-disable-line no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('TRADER_VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('positions[0] must be an instance of the Position class')
        })
      })
    })

    describe('backtest', () => {
      it('must be a boolean', () => {
        let thrownErr = null

        try {
          new Trader({ ...defaultParams, backtest: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('TRADER_VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('backtest must be a boolean')
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
