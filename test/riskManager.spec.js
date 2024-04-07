const { expect, behaviours, chance, Factory } = require('./helpers')

const RiskManager = require('../lib/riskManager')
const Trader = require('../lib/trader')
const Exchange = require('../lib/exchanges/simulation')

describe('RiskManager', () => {
  describe('opts', () => {
    describe('trader', () => {
      const defaultParams = {
        trader: { exchange: () => {} },
        backtest: chance.bool()
      }

      behaviours.throwsRiskManagerValidationError('is required', {
        check: () => (new RiskManager({ ...defaultParams, trader: undefined })),
        expect: error => expect(error.data[0].message).to.eql('trader is required')
      })

      behaviours.throwsRiskManagerValidationError('is required', {
        check: () => (new RiskManager({ ...defaultParams, trader: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('trader must be an Object')
      })
    })
  })

  describe('#calculatePosition', () => {
    const markets = [Factory('market').build({ symbol: 'BTC/USDT' }), Factory('market').build({ symbol: 'ETH/USDT' })]
    const trader = new Trader({ exchange: new Exchange({ markets }) })
    const defaultParams = {
      capital: chance.integer({ min: 1000, max: 2000 }),
      risk: chance.floating({ min: 0, max: 1, fixed: 2 }),
      market: chance.pickone(['BTC/USDT', 'ETH/USDT']),
      entryPrice: 10.00,
      stopLoss: 9.00
    }

    describe('params', () => {
      const manager = new RiskManager({ trader })

      describe('capital', () => {
        behaviours.throwsRiskManagerValidationError('is required', {
          check: () => manager.calculatePosition({ ...defaultParams, capital: undefined }),
          expect: error => expect(error.data[0].message).to.eql('capital is required')
        })

        behaviours.throwsRiskManagerValidationError('must be a number', {
          check: () => manager.calculatePosition({ ...defaultParams, capital: chance.string() }),
          expect: error => expect(error.data[0].message).to.eql('capital must be a number')
        })
      })

      describe('risk', () => {
        behaviours.throwsRiskManagerValidationError('must be a number', {
          check: () => manager.calculatePosition({ ...defaultParams, risk: chance.string() }),
          expect: error => expect(error.data[0].message).to.eql('risk must be a number')
        })

        behaviours.throwsRiskManagerValidationError('must be less than or equal to 1', {
          check: () => manager.calculatePosition({ ...defaultParams, risk: 2.1 }),
          expect: error => expect(error.data[0].message).to.eql('risk must be less than or equal to 1')
        })

        behaviours.throwsRiskManagerValidationError('must be greater than or equal to 0', {
          check: () => manager.calculatePosition({ ...defaultParams, risk: -0.00001 }),
          expect: error => expect(error.data[0].message).to.eql('risk must be greater than or equal to 0')
        })

        it('defaults to 0.01', () => {
          const position = manager.calculatePosition({ ...defaultParams, risk: undefined })

          expect(position.risk).to.eql('0.01')
        })
      })

      describe('market', () => {
        behaviours.throwsRiskManagerValidationError('is required', {
          check: () => manager.calculatePosition({ ...defaultParams, market: undefined }),
          expect: error => expect(error.data[0].message).to.eql('market is required')
        })

        behaviours.throwsRiskManagerValidationError('must be a string', {
          check: () => manager.calculatePosition({ ...defaultParams, market: chance.integer() }),
          expect: error => expect(error.data[0].message).to.eql('market must be a string')
        })

        behaviours.throwsRiskManagerValidationError('must exist', {
          check: () => manager.calculatePosition({ ...defaultParams, market: chance.string() }),
          expect: error => expect(error.data[0].message).to.eql('market does not exist')
        })
      })

      describe('entryPrice', () => {
        behaviours.throwsRiskManagerValidationError('is required', {
          check: () => manager.calculatePosition({ ...defaultParams, entryPrice: undefined }),
          expect: error => expect(error.data[0].message).to.eql('entryPrice is required')
        })

        behaviours.throwsRiskManagerValidationError('must be a number', {
          check: () => manager.calculatePosition({ ...defaultParams, entryPrice: chance.string() }),
          expect: error => expect(error.data[0].message).to.eql('entryPrice must be a number')
        })
      })

      describe('stopLoss', () => {
        behaviours.throwsRiskManagerValidationError('must be a number', {
          check: () => manager.calculatePosition({ ...defaultParams, stopLoss: chance.string() }),
          expect: error => expect(error.data[0].message).to.eql('stopLoss must be a number')
        })

        it('defaults to zero', () => {
          const position = manager.calculatePosition({ ...defaultParams, stopLoss: undefined })

          expect(position.stopLoss).to.eql('0')
        })
      })
    })

    describe('response', () => {
      const manager = new RiskManager({ trader })

      const defaultParams = {
        capital: chance.integer({ min: 1000, max: 2000 }),
        risk: chance.floating({ min: 0.01, max: 0.10, fixed: 2 }),
        entryPrice: 10.00,
        stopLoss: 9.50
      }

      describe('when there is enough capital to cover the full risk value', () => {
        it('sets position size to risk value divided by risk per asset rounded to market precision', () => {
          const position = manager.calculatePosition({
            ...defaultParams,
            capital: '1000',
            risk: '0.01', // 1.00%
            market: 'BTC/USDT',
            entryPrice: '10.00',
            stopLoss: '9.00'
          })

          expect(position).to.deep.include({
            positionSize: '10.00000',
            positionValue: '100.00',
            capitalAtRisk: '10.00'
          })
        })
      })

      describe('when there is not enough capital to cover the full risk value', () => {
        it('sets position size to capital divided by risk per asset rounded to market precision', () => {
          const position = manager.calculatePosition({
            ...defaultParams,
            capital: '1000',
            risk: '0.01', // 1.00%
            market: 'BTC/USDT',
            entryPrice: '10.00',
            stopLoss: '9.99'
          })

          expect(position).to.deep.include({
            positionSize: '100.00000',
            positionValue: '1000.00',
            capitalAtRisk: '1.00'
          })
        })
      })
    })
  })
})
