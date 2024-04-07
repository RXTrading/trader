const { expect, Factory, behaviours, BigNumber, sinon, chance } = require('../helpers')

const PositionManager = require('../../lib/positionManager')
const { Balance, Position, Order, OrderOptions } = require('../../lib/models')
const Exchange = require('../../lib/exchanges/simulation')

describe('PositionManager', () => {
  describe('#open', () => {
    describe('when position is invalid', () => {
      behaviours.throwsValidationError('throws an error', {
        check: () => {
          const manager = new PositionManager({ trader: { on: () => {} } })

          return manager.open()
        },
        expect: error => expect(error.data[0].message).to.eql('exchange is required')
      })
    })

    describe('when position is valid', () => {
      const positionParams = {
        type: Position.types.LONG,
        entries: [{
          exchange: 'binance',
          market: 'BTC/USDT',
          type: OrderOptions.types.LIMIT,
          price: chance.integer({ min: 1, max: 100 }),
          quoteQuantity: 1000.00
        }]
      }

      describe('and creating entry order fails', () => {
        behaviours.throws('throws error', undefined, {
          check: () => {
            const manager = new PositionManager({
              trader: {
                on: () => {},
                exchange: { createOrder: () => { throw new Error('createOrder error') } }
              }
            })

            return manager.open({ ...positionParams })
          },
          expect: error => expect(error.message).to.eql('createOrder error')
        })
      })

      describe('and creating entry order is successful', () => {
        let traderEmitStub
        let manager

        beforeEach(() => {
          const exchange = new Exchange({
            markets: [Factory('market').build()],
            balances: [new Balance({ symbol: 'USDT', free: 1000, used: 0, total: 1000 })]
          })

          const trader = { on: () => {}, emitAsync: () => {}, exchange }
          traderEmitStub = sinon.stub(trader, 'emitAsync')
          manager = new PositionManager({ trader })
        })

        afterEach(() => traderEmitStub.restore())

        it('opens a new LONG position', async () => {
          await manager.open({ ...positionParams })

          const position = manager.all[0]

          expect(position.type).to.eql(Position.types.LONG)
          expect(position.status).to.eql(Position.statuses.OPEN)
        })

        it('opens a BUY entry order from entry params', async () => {
          await manager.open({ ...positionParams })

          const order = manager.all[0].orders[0]

          expect(order.status).to.eql(Order.statuses.OPEN)
          expect(order.side).to.eql(OrderOptions.sides.BUY)
          expect(order.type).to.eql(OrderOptions.types.LIMIT)
          expect(order.price).to.eql(BigNumber(positionParams.entries[0].price).toFixed())
        })

        it('emits position.opened with position', async () => {
          await manager.open({ ...positionParams })

          const position = manager.all[0]

          expect(traderEmitStub).to.have.been.calledWith('position.opened', position)
        })
      })

      describe('and params contains timestamp', () => {
        const timestamp = chance.date()
        let manager

        before(async () => {
          const exchange = new Exchange({
            markets: [Factory('market').build()],
            balances: [new Balance({ symbol: 'USDT', free: 1000, used: 0, total: 1000 })]
          })

          const trader = { on: () => {}, emitAsync: () => {}, exchange }
          manager = new PositionManager({ trader })

          await manager.open({ ...positionParams, timestamp })
        })

        it('sets position timestamp to timestamp param', async () => {
          expect(manager.all[0].timestamp).to.eql(timestamp)
        })

        it('sets entry order timestamp to timestamp param', async () => {
          expect(manager.all[0].orders[0].timestamp).to.eql(timestamp)
        })
      })
    })
  })
})
