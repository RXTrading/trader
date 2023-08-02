const { expect, Factory, chance } = require('./helpers')

const PositionManager = require('../lib/positionManager')
const { Position, Order } = require('../lib/models')

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
            type: chance.pickone(Object.values(Order.types)),
            price: chance.integer({ min: 1, max: 100 }),
            quoteQuantity: 1000.00
          }
        })
      ]
    }

    describe('trader', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          new PositionManager({ ...defaultParams, trader: undefined }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('POSITION_MANAGER_VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('trader is required')
      })

      it('must be an Object', () => {
        let thrownErr = null

        try {
          new PositionManager({ ...defaultParams, trader: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('POSITION_MANAGER_VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('trader must be an Object')
      })

      describe('props', () => {
        describe('on', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              new PositionManager({ ...defaultParams, trader: {} }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('POSITION_MANAGER_VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('trader.on is required')
          })

          it('must be a function', () => {
            let thrownErr = null

            try {
              new PositionManager({ ...defaultParams, trader: { on: chance.string() } }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('POSITION_MANAGER_VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('trader.on must be a function')
          })
        })
      })
    })

    describe('positions', () => {
      it('must be an array', () => {
        let thrownErr = null

        try {
          new PositionManager({ ...defaultParams, positions: chance.string() }) /* eslint-disable-line no-new */
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('POSITION_MANAGER_VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('positions must be an array')
      })

      describe('items', () => {
        it('must be an instance of Position', () => {
          let thrownErr = null

          try {
            new PositionManager({ ...defaultParams, positions: [{ id: 1 }] }) /* eslint-disable-line no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('POSITION_MANAGER_VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('positions[0] must be an instance of the Position class')
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
