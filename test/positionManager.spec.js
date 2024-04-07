const { expect, Factory, behaviours, chance } = require('./helpers')

const PositionManager = require('../lib/positionManager')
const { Position, OrderOptions } = require('../lib/models')

describe('PositionManager', () => {
  describe('options', () => {
    const defaultParams = {
      trader: { on: () => {} },
      positions: [
        new Position({
          exchange: 'binance',
          market: 'BTC/USDT',
          status: chance.pickone(Object.values(Position.statuses)),
          type: chance.pickone(Object.values(Position.types)),
          entry: {
            exchange: 'binance',
            market: 'BTC/USDT',
            type: OrderOptions.types.LIMIT,
            price: chance.integer({ min: 1, max: 100 }),
            quoteQuantity: 1000.00
          }
        })
      ]
    }

    describe('trader', () => {
      behaviours.throwsPositionManagerValidationError('is required', {
        check: () => (new PositionManager({ ...defaultParams, trader: undefined })),
        expect: error => expect(error.data[0].message).to.eql('trader is required')
      })

      behaviours.throwsPositionManagerValidationError('is required', {
        check: () => (new PositionManager({ ...defaultParams, trader: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('trader must be an Object')
      })

      describe('props', () => {
        describe('on', () => {
          behaviours.throwsPositionManagerValidationError('is required', {
            check: () => (new PositionManager({ ...defaultParams, trader: {} })),
            expect: error => expect(error.data[0].message).to.eql('trader.on is required')
          })

          behaviours.throwsPositionManagerValidationError('must be a function', {
            check: () => (new PositionManager({ ...defaultParams, trader: { on: chance.string() } })),
            expect: error => expect(error.data[0].message).to.eql('trader.on must be a function')
          })
        })
      })
    })

    describe('positions', () => {
      behaviours.throwsPositionManagerValidationError('must be an array', {
        check: () => (new PositionManager({ ...defaultParams, positions: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('positions must be an array')
      })

      describe('items', () => {
        behaviours.throwsPositionManagerValidationError('is required', {
          check: () => (new PositionManager({ ...defaultParams, positions: [{ id: 1 }] })),
          expect: error => expect(error.data[0].message).to.eql('positions[0] must be an instance of the Position class')
        })
      })
    })
  })

  describe('#all', () => {
    const defaultParams = {
      trader: { on: () => {} },
      positions: [
        Factory('position').build(),
        Factory('position').build()
      ]
    }

    it('returns all positions', () => {
      const manager = new PositionManager({ ...defaultParams })
      const positions = manager.all

      expect(positions).to.eql(defaultParams.positions)
    })
  })
})
