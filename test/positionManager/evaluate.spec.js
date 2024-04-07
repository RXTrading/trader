const { expect, BigNumber, Factory, sinon, chance } = require('../helpers')

const PositionManager = require('../../lib/positionManager')
const { Balance, Position, OrderOptions, Order } = require('../../lib/models')
const Exchange = require('../../lib/exchanges/simulation')

describe('PositionManager', () => {
  describe('#evaluate', () => {
    describe('order updates', () => {
      let manager
      let exchange
      let position

      before(() => {
        const market = Factory('market').build()
        const exchangeOrder = Factory('exchangeOrder').build({
          type: OrderOptions.types.LIMIT,
          price: 10,
          quoteQuantity: 1000
        })
        const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

        exchange = new Exchange({
          markets: [market],
          balances: [new Balance({ symbol: 'USDT', used: 1000, total: 1000 })],
          orders: [exchangeOrder]
        })

        position = Factory('position').build({ orders: [positionOrder] })
        manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
      })

      it('updates position orders from exchange orders', async () => {
        exchange.setTick(10)
        exchange.setCandle({ open: 9, high: 12, low: 8, close: 11 })

        exchange.evaluate()
        await manager.evaluate()

        expect(position.orders[0]).to.deep.include({
          status: Order.statuses.FILLED,
          averagePrice: '10',
          baseQuantityGross: '100',
          baseQuantityNet: '99.9',
          quoteQuantityGross: '1000',
          quoteQuantityNet: '1000'
        })
      })
    })

    describe('status', () => {
      describe('when offset order quantities is not equal to entry order quantities', () => {
        let manager
        let exchange
        let position

        before(() => {
          const market = Factory('market').build()

          const orderParams = [
            {
              status: Order.statuses.FILLED,
              type: OrderOptions.types.LIMIT,
              price: 10,
              quoteQuantity: 1000,
              averagePrice: '10',
              baseQuantityGross: '100',
              baseQuantityNet: '99.9',
              quoteQuantityGross: '1000',
              quoteQuantityNet: '1000'
            },
            {
              status: Order.statuses.FILLED,
              side: OrderOptions.sides.SELL,
              type: OrderOptions.types.LIMIT,
              price: 20,
              baseQuantity: 50,
              averagePrice: '20',
              baseQuantityGross: '50',
              baseQuantityNet: '50',
              quoteQuantityGross: '1000',
              quoteQuantityNet: '999'
            }
          ]

          const exchangeOrders = []
          const positionOrders = []

          for (let i = 0; i < orderParams.length; i++) {
            const params = orderParams[i]
            const exchangeOrder = Factory('exchangeOrder').build(params)
            const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

            exchangeOrders.push(exchangeOrder)
            positionOrders.push(positionOrder)
          }

          exchange = new Exchange({
            markets: [market],
            balances: [
              new Balance({ symbol: 'BTC', free: 0, used: 99.9, total: 99.9 })
            ],
            orders: exchangeOrders
          })

          position = Factory('position').build({ orders: positionOrders })
          manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
        })

        it('does not change the status', async () => {
          expect(position.status).to.eql(Position.statuses.OPEN)

          exchange.setTick(20)
          exchange.setCandle({ open: 19, high: 22, low: 18, close: 21 })

          exchange.evaluate()
          await manager.evaluate()

          expect(position.status).to.eql(Position.statuses.OPEN)
        })
      })

      describe('when offset order quantities equals entry order quantities', () => {
        let manager
        let position

        beforeEach(() => {
          const market = Factory('market').build()

          const orderParams = [
            {
              status: Order.statuses.FILLED,
              type: OrderOptions.types.LIMIT,
              price: 10,
              quoteQuantity: 1000,
              averagePrice: '10',
              baseQuantityGross: '100',
              baseQuantityNet: '99.9',
              quoteQuantityGross: '1000',
              quoteQuantityNet: '1000'
            },
            {
              status: Order.statuses.FILLED,
              side: OrderOptions.sides.SELL,
              type: OrderOptions.types.LIMIT,
              price: 20,
              baseQuantity: 99.9,
              averagePrice: '20',
              baseQuantityGross: '99.9',
              baseQuantityNet: '99.9',
              quoteQuantityGross: '2000',
              quoteQuantityNet: '1998'
            }
          ]

          const exchangeOrders = []
          const positionOrders = []

          for (let i = 0; i < orderParams.length; i++) {
            const params = orderParams[i]
            const exchangeOrder = Factory('exchangeOrder').build(params)
            const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

            exchangeOrders.push(exchangeOrder)
            positionOrders.push(positionOrder)
          }

          const exchange = new Exchange({
            markets: [market],
            balances: [
              new Balance({ symbol: 'USDT', free: 1998, total: 1998 })
            ],
            orders: exchangeOrders
          })

          position = Factory('position').build({ orders: positionOrders })
          manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })

          exchange.setTick(20)
          exchange.setCandle({ open: 19, high: 22, low: 18, close: 21 })

          exchange.evaluate()
        })

        it('sets status to CLOSED', async () => {
          await manager.evaluate()

          expect(position.status).to.eql(Position.statuses.CLOSED)
        })

        describe('and params contains timestamp', () => {
          it('sets closedAt to the timestamp param', async () => {
            const timestamp = chance.date()
            await manager.evaluate({ timestamp })

            expect(position.closedAt).to.eql(timestamp)
          })
        })
      })
    })

    describe('unrealised PnL', () => {
      describe('when there is unrealized PnL', () => {
        let manager
        let exchange
        let position

        before(() => {
          const market = Factory('market').build()

          const exchangeOrder = Factory('exchangeOrder').build({
            status: Order.statuses.FILLED,
            type: OrderOptions.types.LIMIT,
            price: 10,
            quoteQuantity: 1000,
            averagePrice: '10',
            baseQuantityGross: '100',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1000',
            quoteQuantityNet: '1000'
          })

          const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

          exchange = new Exchange({
            markets: [market],
            balances: [
              new Balance({ symbol: 'BTC', free: 99.9, total: 99.9 })
            ],
            orders: [exchangeOrder]
          })

          position = Factory('position').build({ orders: [positionOrder] })
          manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
        })

        it('correctly calculates unrealized PnL', async () => {
          exchange.setTick(20)
          exchange.setCandle({ open: 19, high: 22, low: 18, close: 21 })

          exchange.evaluate()
          await manager.evaluate()

          expect(position.unrealizedPnL).to.eql(BigNumber(998.00).toFixed())
          expect(position.unrealizedPnLPercent).to.eql(BigNumber(99.80).toFixed())
        })
      })

      describe('when there is no unrealized PnL', () => {
        let manager
        let exchange
        let position

        before(() => {
          const market = Factory('market').build()

          const orderParams = [
            {
              status: Order.statuses.FILLED,
              type: OrderOptions.types.LIMIT,
              price: 10,
              quoteQuantity: 1000,
              averagePrice: '10',
              baseQuantityGross: '100',
              baseQuantityNet: '99.9',
              quoteQuantityGross: '1000',
              quoteQuantityNet: '1000'
            },
            {
              status: Order.statuses.FILLED,
              side: OrderOptions.sides.SELL,
              type: OrderOptions.types.LIMIT,
              price: 20,
              baseQuantity: 99.9,
              averagePrice: '20',
              baseQuantityGross: '99.9',
              baseQuantityNet: '99.9',
              quoteQuantityGross: '2000',
              quoteQuantityNet: '1998'
            }
          ]

          const exchangeOrders = []
          const positionOrders = []

          for (let i = 0; i < orderParams.length; i++) {
            const params = orderParams[i]
            const exchangeOrder = Factory('exchangeOrder').build(params)
            const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

            exchangeOrders.push(exchangeOrder)
            positionOrders.push(positionOrder)
          }

          exchange = new Exchange({
            markets: [market],
            balances: [
              new Balance({ symbol: 'USDT', free: 1998, total: 1998 })
            ],
            orders: exchangeOrders
          })

          position = Factory('position').build({ orders: positionOrders })
          manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
        })

        it('sets unrealized PnL to zero', async () => {
          exchange.setTick(10)
          exchange.setCandle({ open: 9, high: 12, low: 8, close: 11 })

          exchange.evaluate()
          await manager.evaluate()

          expect(position.unrealizedPnL).to.eql(BigNumber(0).toFixed())
          expect(position.unrealizedPnLPercent).to.eql(BigNumber(0).toFixed())
        })
      })
    })

    describe('realized PnL', () => {
      describe('when there is realized PnL', () => {
        let manager
        let exchange
        let position

        before(() => {
          const market = Factory('market').build()

          const orderParams = [
            {
              status: Order.statuses.FILLED,
              type: OrderOptions.types.LIMIT,
              price: 10,
              quoteQuantity: 1000,
              averagePrice: '10',
              baseQuantityGross: '100',
              baseQuantityNet: '99.9',
              quoteQuantityGross: '1000',
              quoteQuantityNet: '1000'
            },
            {
              status: Order.statuses.FILLED,
              side: OrderOptions.sides.SELL,
              type: OrderOptions.types.LIMIT,
              price: 20,
              baseQuantity: 99.9,
              averagePrice: '20',
              baseQuantityGross: '99.9',
              baseQuantityNet: '99.9',
              quoteQuantityGross: '2000',
              quoteQuantityNet: '1998'
            }
          ]

          const exchangeOrders = []
          const positionOrders = []

          for (let i = 0; i < orderParams.length; i++) {
            const params = orderParams[i]
            const exchangeOrder = Factory('exchangeOrder').build(params)
            const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

            exchangeOrders.push(exchangeOrder)
            positionOrders.push(positionOrder)
          }

          exchange = new Exchange({
            markets: [market],
            balances: [
              new Balance({ symbol: 'BTC', free: 1998, total: 1000 })
            ],
            orders: exchangeOrders
          })

          position = Factory('position').build({ orders: positionOrders })
          manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
        })

        it('correctly calculates realized PnL', async () => {
          exchange.setTick(10)
          exchange.setCandle({ open: 9, high: 12, low: 8, close: 11 })

          exchange.evaluate()
          await manager.evaluate()

          expect(position.realizedPnL).to.eql(BigNumber(998).toFixed())
          expect(position.realizedPnLPercent).to.eql(BigNumber(99.8).toFixed())
        })
      })

      describe('when there is no realized PnL', () => {
        let manager
        let exchange
        let position

        before(() => {
          const market = Factory('market').build()

          const exchangeOrder = Factory('exchangeOrder').build({
            status: Order.statuses.FILLED,
            type: OrderOptions.types.LIMIT,
            price: 10,
            quoteQuantity: 1000,
            averagePrice: '10',
            baseQuantityGross: '100',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1000',
            quoteQuantityNet: '1000'
          })

          const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

          exchange = new Exchange({
            markets: [market],
            balances: [
              new Balance({ symbol: 'BTC', free: 0, used: 99.9, total: 99.9 })
            ],
            orders: [exchangeOrder]
          })

          position = Factory('position').build({ orders: [positionOrder] })
          manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
        })

        it('sets realized PnL to 0', async () => {
          exchange.setTick(15)
          exchange.setCandle({ open: 9, high: 12, low: 8, close: 11 })

          exchange.evaluate()
          await manager.evaluate()

          expect(position.realizedPnL).to.eql(BigNumber(0).toFixed())
          expect(position.realizedPnLPercent).to.eql(BigNumber(0).toFixed())
        })
      })
    })

    describe('PnL', () => {
      let manager
      let exchange
      let position

      before(() => {
        const market = Factory('market').build()

        const orderParams = [
          {
            status: Order.statuses.FILLED,
            type: OrderOptions.types.LIMIT,
            price: 10,
            quoteQuantity: 1000,
            averagePrice: '10',
            baseQuantityGross: '100',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1000',
            quoteQuantityNet: '1000'
          },
          {
            status: Order.statuses.FILLED,
            side: OrderOptions.sides.SELL,
            type: OrderOptions.types.LIMIT,
            price: 15,
            baseQuantity: 50,
            averagePrice: '20',
            baseQuantityGross: '50',
            baseQuantityNet: '50',
            quoteQuantityGross: '750',
            quoteQuantityNet: '749.25'
          }
        ]

        const exchangeOrders = []
        const positionOrders = []

        for (let i = 0; i < orderParams.length; i++) {
          const params = orderParams[i]
          const exchangeOrder = Factory('exchangeOrder').build(params)
          const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

          exchangeOrders.push(exchangeOrder)
          positionOrders.push(positionOrder)
        }

        exchange = new Exchange({
          markets: [market],
          balances: [
            new Balance({ symbol: 'BTC', free: 49.9, total: 49.9 }),
            new Balance({ symbol: 'USDT', free: 749.25, total: 749.25 })
          ],
          orders: exchangeOrders
        })

        position = Factory('position').build({ orders: positionOrders })
        manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
      })

      it('correctly calculates PnL from realized and unrealized PnL', async () => {
        exchange.setTick(20)
        exchange.setCandle({ open: 19, high: 22, low: 18, close: 21 })

        exchange.evaluate()
        await manager.evaluate()

        expect(position.realizedPnL).to.eql(BigNumber(-250.75).toFixed())
        expect(position.realizedPnLPercent).to.eql(BigNumber(-25.07).toFixed())
        expect(position.unrealizedPnL).to.eql(BigNumber(747.25).toFixed())
        expect(position.unrealizedPnLPercent).to.eql(BigNumber(74.72).toFixed())
      })
    })

    describe('win', () => {
      describe('when status is CLOSED', () => {
        describe('and PnL is positive', () => {
          let manager
          let exchange
          let position

          before(() => {
            const market = Factory('market').build()

            const orderParams = [
              {
                status: Order.statuses.FILLED,
                type: OrderOptions.types.LIMIT,
                price: 10,
                quoteQuantity: 1000,
                averagePrice: '10',
                baseQuantityGross: '100',
                baseQuantityNet: '99.9',
                quoteQuantityGross: '1000',
                quoteQuantityNet: '1000'
              },
              {
                status: Order.statuses.OPEN,
                side: OrderOptions.sides.SELL,
                type: OrderOptions.types.LIMIT,
                price: 20,
                baseQuantity: 99.9
              }
            ]

            const exchangeOrders = []
            const positionOrders = []

            for (let i = 0; i < orderParams.length; i++) {
              const params = orderParams[i]
              const exchangeOrder = Factory('exchangeOrder').build(params)
              const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

              exchangeOrders.push(exchangeOrder)
              positionOrders.push(positionOrder)
            }

            exchange = new Exchange({
              markets: [market],
              balances: [
                new Balance({ symbol: 'BTC', free: 0, used: 99.9, total: 99.9 })
              ],
              orders: exchangeOrders
            })

            position = Factory('position').build({ orders: positionOrders })
            manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
          })

          it('sets win to true', async () => {
            exchange.setTick(20)
            exchange.setCandle({ open: 19, high: 22, low: 18, close: 21 })

            exchange.evaluate()
            await manager.evaluate()

            expect(position.status).to.eql(Position.statuses.CLOSED)
            expect(position.realizedPnL).to.eql(BigNumber(996.01).toFixed())
            expect(position.realizedPnLPercent).to.eql(BigNumber(99.6).toFixed())
            expect(position.unrealizedPnL).to.eql(BigNumber(0).toFixed())
            expect(position.unrealizedPnLPercent).to.eql(BigNumber(0).toFixed())
            expect(position.pnl).to.eql(BigNumber(996.01).toFixed())
            expect(position.pnlPercent).to.eql(BigNumber(99.6).toFixed())
            expect(position.win).to.eql(true)
          })
        })

        describe('and PnL is neutral', () => {
          let manager
          let exchange
          let position

          before(() => {
            const market = Factory('market').build()

            const orderParams = [
              {
                status: Order.statuses.FILLED,
                type: OrderOptions.types.LIMIT,
                price: 10,
                quoteQuantity: 1000,
                averagePrice: '10',
                baseQuantityGross: '100',
                baseQuantityNet: '99.9',
                quoteQuantityGross: '1000',
                quoteQuantityNet: '1000'
              },
              {
                status: Order.statuses.OPEN,
                side: OrderOptions.sides.SELL,
                type: OrderOptions.types.LIMIT,
                price: 10.02,
                baseQuantity: 99.9
              }
            ]

            const exchangeOrders = []
            const positionOrders = []

            for (let i = 0; i < orderParams.length; i++) {
              const params = orderParams[i]
              const exchangeOrder = Factory('exchangeOrder').build(params)
              const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

              exchangeOrders.push(exchangeOrder)
              positionOrders.push(positionOrder)
            }

            exchange = new Exchange({
              markets: [market],
              balances: [
                new Balance({ symbol: 'BTC', free: 0, used: 99.9, total: 99.9 })
              ],
              orders: exchangeOrders
            })

            position = Factory('position').build({ orders: positionOrders })
            manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
          })

          it('sets win to false', async () => {
            exchange.setTick(10.01)
            exchange.setCandle({ open: 9, high: 12, low: 8, close: 11 })

            exchange.evaluate()
            await manager.evaluate()

            expect(position.status).to.eql(Position.statuses.CLOSED)
            expect(position.realizedPnL).to.eql(BigNumber(0).toFixed())
            expect(position.realizedPnLPercent).to.eql(BigNumber(0).toFixed())
            expect(position.unrealizedPnL).to.eql(BigNumber(0).toFixed())
            expect(position.unrealizedPnLPercent).to.eql(BigNumber(0).toFixed())

            expect(position.pnl).to.eql(BigNumber(0).toFixed())
            expect(position.pnlPercent).to.eql(BigNumber(0).toFixed())
            expect(position.win).to.eql(false)
          })
        })

        describe('and PnL is negative', () => {
          let manager
          let exchange
          let position

          before(() => {
            const market = Factory('market').build()

            const orderParams = [
              {
                status: Order.statuses.FILLED,
                type: OrderOptions.types.LIMIT,
                price: 10,
                quoteQuantity: 1000,
                averagePrice: '10',
                baseQuantityGross: '100',
                baseQuantityNet: '99.9',
                quoteQuantityGross: '1000',
                quoteQuantityNet: '1000'
              },
              {
                status: Order.statuses.OPEN,
                side: OrderOptions.sides.SELL,
                type: OrderOptions.types.LIMIT,
                price: 8.75,
                baseQuantity: 99.9
              }
            ]

            const exchangeOrders = []
            const positionOrders = []

            for (let i = 0; i < orderParams.length; i++) {
              const params = orderParams[i]
              const exchangeOrder = Factory('exchangeOrder').build(params)
              const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

              exchangeOrders.push(exchangeOrder)
              positionOrders.push(positionOrder)
            }

            exchange = new Exchange({
              markets: [market],
              balances: [
                new Balance({ symbol: 'BTC', free: 0, used: 99.9, total: 99.9 })
              ],
              orders: exchangeOrders
            })

            position = Factory('position').build({ orders: positionOrders })
            manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
          })

          it('sets win to false', async () => {
            exchange.setTick(8.75)
            exchange.setCandle({ open: 9, high: 12, low: 8, close: 11 })

            exchange.evaluate()
            await manager.evaluate()

            expect(position.status).to.eql(Position.statuses.CLOSED)
            expect(position.realizedPnL).to.eql(BigNumber(-126.74).toFixed())
            expect(position.realizedPnLPercent).to.eql(BigNumber(-12.67).toFixed())
            expect(position.unrealizedPnL).to.eql(BigNumber(0).toFixed())
            expect(position.unrealizedPnLPercent).to.eql(BigNumber(0).toFixed())
            expect(position.pnl).to.eql(BigNumber(-126.74).toFixed())
            expect(position.pnlPercent).to.eql(BigNumber(-12.67).toFixed())
            expect(position.win).to.eql(false)
          })
        })
      })

      describe('when status is not CLOSED', () => {
        let manager
        let exchange
        let position

        before(() => {
          const market = Factory('market').build()

          const exchangeOrder = Factory('exchangeOrder').build({
            status: Order.statuses.FILLED,
            type: OrderOptions.types.LIMIT,
            price: 10,
            quoteQuantity: 1000,
            averagePrice: '10',
            baseQuantityGross: '100',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1000',
            quoteQuantityNet: '1000'
          })

          const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

          exchange = new Exchange({
            markets: [market],
            balances: [
              new Balance({ symbol: 'BTC', free: 0, used: 99.9, total: 99.9 })
            ],
            orders: [exchangeOrder]
          })

          position = Factory('position').build({ orders: [positionOrder] })
          manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
        })

        it('sets win to null', async () => {
          exchange.setTick(20)
          exchange.setCandle({ open: 19, high: 22, low: 18, close: 21 })

          exchange.evaluate()
          await manager.evaluate()

          expect(position.status).to.eql(Position.statuses.OPEN)
          expect(position.win).to.eql(null)
        })
      })
    })

    describe('events', () => {
      let manager
      let exchange
      let traderEmitStub

      before(() => {
        const market = Factory('market').build()
        const exchangeOrders = []
        const positions = []

        for (let i = 0; i < 3; i++) {
          const exchangeOrder = Factory('exchangeOrder').build({
            type: OrderOptions.types.LIMIT,
            price: 10,
            quoteQuantity: 1000
          })

          const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

          exchangeOrders.push(exchangeOrder)
          positions.push(Factory('position').build({ orders: [positionOrder] }))
        }

        exchange = new Exchange({
          markets: [market],
          balances: [new Balance({ symbol: 'USDT', used: 1000, total: 1000 })],
          orders: exchangeOrders
        })

        const trader = { on: () => {}, emitAsync: () => {}, exchange }
        traderEmitStub = sinon.stub(trader, 'emitAsync')
        manager = new PositionManager({ trader, positions })
      })

      after(() => traderEmitStub.restore())

      it('emits position.updated for each evaluated position', async () => {
        exchange.setTick(20)
        exchange.setCandle({ open: 19, high: 22, low: 18, close: 21 })

        exchange.evaluate()
        await manager.evaluate()

        expect(traderEmitStub).to.have.been.calledThrice()
        expect(traderEmitStub).to.have.been.calledWith('position.updated', manager.all[0])
        expect(traderEmitStub).to.have.been.calledWith('position.updated', manager.all[1])
        expect(traderEmitStub).to.have.been.calledWith('position.updated', manager.all[2])
      })
    })
  })
})
