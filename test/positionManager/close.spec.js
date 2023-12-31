const _ = require('lodash')

const { expect, Factory, BigNumber, sinon, chance } = require('../helpers')

const PositionManager = require('../../lib/positionManager')
const { Balance, Position, Order, ExchangeOrder } = require('../../lib/models')
const Exchange = require('../../lib/exchanges/simulation')

describe('PositionManager', () => {
  describe('#close', () => {
    describe('params', () => {
      let position
      let manager

      before(() => {
        position = Factory('position').build()
        manager = new PositionManager({ trader: { on: () => {} }, positions: [position] })
      })

      describe('id', () => {
        it('is required', async () => {
          let thrownErr = null

          try {
            await manager.close()
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('POSITION_MANAGER_VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('id is required')
        })

        it('must be a UUID', async () => {
          let thrownErr = null

          try {
            await manager.close({ id: chance.string() })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('POSITION_MANAGER_VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('id must be a valid UUID')
        })

        it('must exist', async () => {
          let thrownErr = null

          try {
            await manager.close({ id: chance.guid() })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('POSITION_MANAGER_VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('position does not exist')
        })
      })

      describe('timestamp', () => {
        it('must be a date', async () => {
          let thrownErr = null

          try {
            await manager.close({ id: position.id, timestamp: 'tomorrow' })
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('POSITION_MANAGER_VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('timestamp must be a Date')
        })
      })
    })

    describe('position', () => {
      let position

      beforeEach(() => {
        position = Factory('position').build()
      })

      describe('status', () => {
        let exchangeOrder

        beforeEach(() => {
          exchangeOrder = Factory('exchangeOrder').build({
            status: Order.statuses.FILLED,
            type: Order.types.LIMIT,
            price: 10,
            averagePrice: 10,
            quoteQuantity: 1000.00,
            baseQuantityGross: 100,
            baseQuantityNet: 99.9,
            quoteQuantityGross: 1000,
            quoteQuantityNet: 1000
          })

          const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

          position.set({ orders: [...position.orders, positionOrder] })
        })

        it('sets status as CLOSING', async () => {
          const exchange = new Exchange({
            markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
            balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })],
            orders: [exchangeOrder]
          })

          exchange.setTick(20)
          exchange.setCandle({ open: 12, high: 22, low: 10, close: 20 })

          const manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })

          await manager.close({ id: position.id })

          expect(position.status).to.eql(Position.statuses.CLOSING)
        })
      })

      describe('when there are existing OPEN orders', () => {
        let exchangeOrder

        beforeEach(() => {
          exchangeOrder = Factory('exchangeOrder').build({
            status: Order.statuses.OPEN,
            type: ExchangeOrder.types.LIMIT,
            side: ExchangeOrder.sides.SELL,
            price: 15,
            baseQuantity: 50
          })

          const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

          position.set({ orders: [...position.orders, positionOrder] })
        })

        it('cancels existing OPEN orders', async () => {
          const exchange = new Exchange({
            markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
            balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 50, total: 99.9 })],
            orders: [exchangeOrder]
          })

          const manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })

          await manager.close({ id: position.id })

          expect(position.orders[0].status).to.eql(Order.statuses.CANCELLED)
        })

        describe('and cancelling an existing order fails', () => {
          it('throws an error', async () => {
            const manager = new PositionManager({
              trader: {
                on: () => {},
                exchange: { cancelOrder: () => { throw new Error('cancelOrder error') } }
              },
              positions: [position]
            })

            let thrownErr = null

            try {
              await manager.close({ id: position.id })
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.message).to.eql('cancelOrder error')
          })
        })
      })

      describe('when an offset order is required', () => {
        const market = Factory('market').build({ symbol: 'BTC/USDT' })
        let exchange
        let trader
        let traderEmitStub

        beforeEach(() => {
          const existingOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entry, ['exchange', 'market', 'type', 'price', 'quoteQuantity']),
              side: Order.sides.BUY
            },
            status: Order.statuses.FILLED,
            side: Order.sides.BUY,
            ..._.pick(position.entry, ['exchange', 'market', 'type', 'price']),
            baseQuantityGross: '100',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1000',
            quoteQuantityNet: '1000',
            averagePrice: '10'
          })

          position.set({ orders: [existingOrder] })

          exchange = new Exchange({
            markets: [market],
            balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })]
          })

          exchange.setTick(20)
          exchange.setCandle({ open: 12, high: 22, low: 10, close: 20 })

          trader = { on: () => {}, emitAsync: () => {}, exchange }
          traderEmitStub = sinon.stub(trader, 'emitAsync')
        })

        afterEach(() => traderEmitStub.restore())

        it('creates an offset order for remaining unsold quantity', async () => {
          const manager = new PositionManager({ trader, positions: [position] })
          await manager.close({ id: position.id })

          const buyOrder = position.orders[0]
          const sellOrder = position.orders[1]

          const quotePrecision = market.precision.price
          const expectedQuoteNet = BigNumber(sellOrder.baseQuantityNet).multipliedBy(sellOrder.averagePrice).toFixed(quotePrecision, BigNumber.ROUND_UP)
          const feeCost = BigNumber(expectedQuoteNet).multipliedBy(market.fees.maker).toFixed()
          const expectedQuoteGross = BigNumber(expectedQuoteNet).minus(feeCost).toFixed(quotePrecision, BigNumber.ROUND_UP)

          expect(sellOrder.side).to.eql(Order.sides.SELL)
          expect(sellOrder.type).to.eql(Order.types.MARKET)
          expect(sellOrder.status).to.eql(Order.statuses.FILLED)
          expect(sellOrder.baseQuantityGross).to.eql(buyOrder.baseQuantityNet)
          expect(sellOrder.baseQuantityNet).to.eql(buyOrder.baseQuantityNet)
          expect(sellOrder.quoteQuantityGross).to.eql(BigNumber(expectedQuoteNet).toFixed())
          expect(sellOrder.quoteQuantityNet).to.eql(BigNumber(expectedQuoteGross).toFixed())
        })

        describe('and params contains timestamp', () => {
          it('sets offset order timestamp to timestamp param', async () => {
            const timestamp = chance.date()
            const manager = new PositionManager({ trader, positions: [position] })

            await manager.close({ id: position.id, timestamp })

            expect(position.orders[1].timestamp).to.eql(timestamp)
          })
        })

        it('emits position.updated with position', async () => {
          const manager = new PositionManager({ trader, positions: [position] })
          await manager.close({ id: position.id })

          expect(traderEmitStub).to.have.been.calledWith('position.updated', position)
        })

        describe('and creating offset order fails', () => {
          it('throws an error', async () => {
            const manager = new PositionManager({
              trader: {
                on: () => {},
                exchange: { createOrder: () => { throw new Error('createOrder error') } }
              },
              positions: [position]
            })

            let thrownErr = null

            try {
              await manager.close({ id: position.id })
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.message).to.eql('createOrder error')
          })
        })
      })

      describe('when no offset order is required', () => {
        const market = Factory('market').build({ symbol: 'BTC/USDT' })
        let exchange

        beforeEach(() => {
          const buyOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entry, ['exchange', 'market', 'type', 'price', 'quoteQuantity']),
              side: Order.sides.BUY
            },
            status: Order.statuses.FILLED,
            side: Order.sides.BUY,
            ..._.pick(position.entry, ['exchange', 'market', 'type', 'price']),
            baseQuantityGross: '100',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1000',
            quoteQuantityNet: '1000',
            averagePrice: '10'
          })

          const sellOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entry, ['exchange', 'market']),
              type: Order.types.LIMIT,
              side: Order.sides.SELL,
              price: 20.00,
              baseQuantity: 99.9
            },
            status: Order.statuses.FILLED,
            ..._.pick(position.entry, ['exchange', 'market']),
            type: Order.types.LIMIT,
            side: Order.sides.SELL,
            price: 20.00,
            averagePrice: 20.00,
            baseQuantityGross: '99.9',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1998.0',
            quoteQuantityNet: '1996.00' // 1996.002 after fees, rounded down
          })

          position.set({ orders: [buyOrder, sellOrder] })

          exchange = new Exchange({
            markets: [market],
            balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })]
          })

          exchange.setTick(20)
          exchange.setCandle({ open: 12, high: 22, low: 10, close: 20 })
        })

        it('does not create an offset order', async () => {
          const manager = new PositionManager({ trader: { on: () => {}, exchange }, positions: [position] })
          await manager.close({ id: position.id })

          expect(position.orders.length).to.eql(2)
        })
      })

      describe('when offset base quantity is for less than Market minimum amount', () => {
        const market = Factory('market').build({ limits: { amount: { min: 0.001 } } })

        let exchange

        beforeEach(() => {
          const buyOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entry, ['exchange', 'market', 'type', 'price', 'quoteQuantity']),
              side: Order.sides.BUY
            },
            status: Order.statuses.FILLED,
            side: Order.sides.BUY,
            ..._.pick(position.entry, ['exchange', 'market', 'type', 'price']),
            baseQuantityGross: '100',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1000',
            quoteQuantityNet: '1000',
            averagePrice: '10'
          })

          const sellOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entry, ['exchange', 'market']),
              type: Order.types.LIMIT,
              side: Order.sides.SELL,
              price: 20.00,
              baseQuantity: 99.9
            },
            status: Order.statuses.FILLED,
            ..._.pick(position.entry, ['exchange', 'market']),
            type: Order.types.LIMIT,
            side: Order.sides.SELL,
            price: 20.00,
            averagePrice: 20.00,
            baseQuantityGross: '99.8991',
            baseQuantityNet: '99.8991',
            quoteQuantityGross: '1997.98', // 1997.982, Rounded down
            quoteQuantityNet: '1995.98' // 1995.984018 after fees, rounded down
          })

          position.set({ orders: [buyOrder, sellOrder] })

          exchange = new Exchange({
            markets: [market],
            balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })]
          })

          exchange.setTick(20)
          exchange.setCandle({ open: 12, high: 22, low: 10, close: 20 })
        })

        it('does not create an offset order', async () => {
          const manager = new PositionManager({ trader: { on: () => {}, exchange }, positions: [position] })
          await manager.close({ id: position.id })

          expect(position.orders.length).to.eql(2)
        })
      })

      describe('when offset quote quantity is for less than Market minimum cost', () => {
        const market = Factory('market').build({ limits: { cost: { min: 1.00 } } })

        let exchange

        beforeEach(() => {
          const buyOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entry, ['exchange', 'market', 'type', 'price', 'quoteQuantity']),
              side: Order.sides.BUY
            },
            status: Order.statuses.FILLED,
            side: Order.sides.BUY,
            ..._.pick(position.entry, ['exchange', 'market', 'type', 'price']),
            baseQuantityGross: '100',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1000',
            quoteQuantityNet: '1000',
            averagePrice: '10'
          })

          const sellOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entry, ['exchange', 'market']),
              type: Order.types.LIMIT,
              side: Order.sides.SELL,
              price: 20.00,
              baseQuantity: 99.9
            },
            status: Order.statuses.FILLED,
            ..._.pick(position.entry, ['exchange', 'market']),
            type: Order.types.LIMIT,
            side: Order.sides.SELL,
            price: 20.00,
            averagePrice: 20.00,
            baseQuantityGross: '99.89',
            baseQuantityNet: '99.89',
            quoteQuantityGross: '1997.8',
            quoteQuantityNet: '1995.80' // 1995.8022 after fees, rounded down
          })

          position.set({ orders: [buyOrder, sellOrder] })

          exchange = new Exchange({
            markets: [market],
            balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })]
          })

          exchange.setTick(20)
          exchange.setCandle({ open: 12, high: 22, low: 10, close: 20 })
        })

        it('does not create an offset order', async () => {
          const manager = new PositionManager({ trader: { on: () => {}, exchange }, positions: [position] })
          await manager.close({ id: position.id })

          expect(position.orders.length).to.eql(2)
        })
      })
    })
  })
})
