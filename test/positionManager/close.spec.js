const _ = require('lodash')

const { expect, Factory, behaviours, BigNumber, sinon, chance, moment } = require('../helpers')

const PositionManager = require('../../lib/positionManager')
const { Balance, Position, Order, OrderOptions } = require('../../lib/models')
const Exchange = require('../../lib/exchanges/simulation')

describe('PositionManager', () => {
  const defaultCandle = {
    timestamp: moment().utc().subtract(5, 'minutes').toDate(),
    open: 12,
    high: 22,
    low: 10,
    close: 20
  }
  const defaultTick = chance.floating({ min: defaultCandle.low, max: defaultCandle.high })

  describe('#close', () => {
    describe('params', () => {
      let position
      let manager

      before(() => {
        position = Factory('position').build()
        manager = new PositionManager({ trader: { on: () => {} }, positions: [position] })
      })

      describe('id', () => {
        behaviours.throwsPositionManagerValidationError('is required', {
          check: () => manager.close(),
          expect: error => expect(error.data[0].message).to.eql('id is required')
        })

        behaviours.throwsPositionManagerValidationError('must be a UUID', {
          check: () => manager.close({ id: chance.string() }),
          expect: error => expect(error.data[0].message).to.eql('id must be a valid UUID')
        })

        behaviours.throwsPositionManagerValidationError('must exist', {
          check: () => manager.close({ id: chance.guid() }),
          expect: error => expect(error.data[0].message).to.eql('position does not exist')
        })
      })

      describe('timestamp', () => {
        behaviours.throwsPositionManagerValidationError('is required', {
          check: () => manager.close({ id: position.id, timestamp: 'tomorrow' }),
          expect: error => expect(error.data[0].message).to.eql('timestamp must be a Date')
        })
      })
    })

    describe('position', () => {
      let position

      beforeEach(() => {
        position = Factory('position').build()
      })

      describe('when position does not have orders', () => {
        describe('status', () => {
          it('is set to CLOSED', async () => {
            const exchange = new Exchange({
              markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
              balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })],
              orders: []
            })
            exchange.setTick(defaultTick)
            exchange.setCandle(defaultCandle)

            const manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
            await manager.close({ id: position.id })

            expect(position.status).to.eql(Position.statuses.CLOSED)
          })
        })

        describe('closedAt', () => {
          describe('when params contains timestamp', () => {
            it('sets position closedAt to timestamp param', async () => {
              const timestamp = chance.date()
              const exchange = new Exchange({
                markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
                balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })],
                orders: []
              })
              exchange.setTick(defaultTick)
              exchange.setCandle(defaultCandle)

              const manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
              await manager.close({ id: position.id, timestamp })

              expect(position.closedAt).to.eql(timestamp)
            })
          })

          describe('when params does not contain timestamp', async () => {
            it('sets position closedAt to current time', async () => {
              const exchange = new Exchange({
                markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
                balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })],
                orders: []
              })
              exchange.setTick(defaultTick)
              exchange.setCandle(defaultCandle)

              const manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
              await manager.close({ id: position.id })

              expect(position.closedAt).to.be.closeToTime(new Date(), 1)
            })
          })
        })
      })

      describe('when position has orders', () => {
        let exchangeOrder

        beforeEach(() => {
          exchangeOrder = Factory('exchangeOrder').build({
            status: Order.statuses.FILLED,
            type: OrderOptions.types.LIMIT,
            price: 10,
            averagePrice: 10,
            quoteQuantity: 1000.00,
            baseQuantityGross: 100,
            baseQuantityNet: 99.9,
            quoteQuantityGross: 1000,
            quoteQuantityNet: 1000,
            closedAt: moment().utc().subtract(5, 'minutes').toDate()
          })

          const positionOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

          position.set({ orders: [...position.orders, positionOrder] })
        })

        describe('status', () => {
          it('sets status as CLOSING', async () => {
            const exchange = new Exchange({
              markets: [Factory('market').build({ symbol: 'BTC/USDT' })],
              balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })],
              orders: [exchangeOrder]
            })
            exchange.setTick(defaultTick)
            exchange.setCandle(defaultCandle)

            const manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
            await manager.close({ id: position.id })

            expect(position.status).to.eql(Position.statuses.CLOSING)
          })
        })
      })

      describe('when there are existing OPEN orders', () => {
        let exchangeOrder

        beforeEach(() => {
          exchangeOrder = Factory('exchangeOrder').build({
            status: Order.statuses.OPEN,
            type: OrderOptions.types.LIMIT,
            side: OrderOptions.sides.SELL,
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
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)

          const manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })

          await manager.close({ id: position.id })

          expect(position.orders[0].status).to.eql(Order.statuses.CANCELLED)
        })

        describe('and cancelling an existing order fails', () => {
          behaviours.throws('throws an error', undefined, {
            check: () => {
              const manager = new PositionManager({
                trader: {
                  on: () => {},
                  exchange: { cancelOrder: () => { throw new Error('cancelOrder error') } }
                },
                positions: [position]
              })

              return manager.close({ id: position.id })
            },
            expect: error => expect(error.message).to.eql('cancelOrder error')
          })
        })
      })

      describe('when an offset order is required', () => {
        const market = Factory('market').build({ symbol: 'BTC/USDT' })
        let exchange
        let trader

        beforeEach(() => {
          const existingOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entries[0], ['exchange', 'market', 'type', 'price', 'quoteQuantity']),
              side: OrderOptions.sides.BUY
            },
            status: Order.statuses.FILLED,
            side: OrderOptions.sides.BUY,
            ..._.pick(position.entries[0], ['exchange', 'market', 'type', 'price']),
            baseQuantityGross: '100',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1000',
            quoteQuantityNet: '1000',
            averagePrice: '10',
            closedAt: moment().utc().subtract(5, 'minutes').toDate()
          })

          position.set({ orders: [existingOrder] })

          exchange = new Exchange({
            markets: [market],
            balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })]
          })

          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)

          trader = { on: () => {}, emitAsync: () => {}, exchange }
        })

        it('creates an offset order for remaining unsold quantity', async () => {
          const manager = new PositionManager({ trader, positions: [position] })
          await manager.close({ id: position.id })

          const buyOrder = position.orders[0]
          const sellOrder = position.orders[1]

          const quotePrecision = market.precision.price
          const expectedQuoteNet = BigNumber(sellOrder.baseQuantityNet).multipliedBy(sellOrder.averagePrice).toFixed(quotePrecision, BigNumber.ROUND_UP)
          const feeCost = BigNumber(expectedQuoteNet).multipliedBy(market.fees.maker).toFixed()
          const expectedQuoteGross = BigNumber(expectedQuoteNet).minus(feeCost).toFixed(quotePrecision, BigNumber.ROUND_UP)

          expect(sellOrder.side).to.eql(OrderOptions.sides.SELL)
          expect(sellOrder.type).to.eql(OrderOptions.types.MARKET)
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

        describe('and creating offset order fails', () => {
          behaviours.throws('throws an error', undefined, {
            check: () => {
              const manager = new PositionManager({
                trader: {
                  on: () => {},
                  exchange: { createOrder: () => { throw new Error('createOrder error') } }
                },
                positions: [position]
              })

              return manager.close({ id: position.id })
            },
            expect: error => expect(error.message).to.eql('createOrder error')
          })
        })
      })

      describe('when no offset order is required', () => {
        const market = Factory('market').build({ symbol: 'BTC/USDT' })
        let exchange
        let trader

        beforeEach(() => {
          const buyOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entries[0], ['exchange', 'market', 'type', 'price', 'quoteQuantity']),
              side: OrderOptions.sides.BUY
            },
            status: Order.statuses.FILLED,
            side: OrderOptions.sides.BUY,
            ..._.pick(position.entries[0], ['exchange', 'market', 'type', 'price']),
            baseQuantityGross: '100',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1000',
            quoteQuantityNet: '1000',
            averagePrice: '10',
            closedAt: moment().utc().subtract(5, 'minutes').toDate()
          })

          const sellOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entries[0], ['exchange', 'market']),
              type: OrderOptions.types.LIMIT,
              side: OrderOptions.sides.SELL,
              price: 20.00,
              baseQuantity: 99.9
            },
            status: Order.statuses.FILLED,
            ..._.pick(position.entries[0], ['exchange', 'market']),
            type: OrderOptions.types.LIMIT,
            side: OrderOptions.sides.SELL,
            price: 20.00,
            averagePrice: 20.00,
            baseQuantityGross: '99.9',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1998.0',
            quoteQuantityNet: '1996.00', // 1996.002 after fees, rounded down
            closedAt: moment().utc().subtract(5, 'minutes').toDate()
          })

          position.set({ orders: [buyOrder, sellOrder] })

          exchange = new Exchange({
            markets: [market],
            balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })]
          })

          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)

          trader = { on: () => {}, emitAsync: () => {}, exchange }
        })

        describe('offset order', () => {
          it('does not create an offset order', async () => {
            const manager = new PositionManager({ trader, positions: [position] })
            await manager.close({ id: position.id })

            expect(position.orders.length).to.eql(2)
          })
        })

        describe('closedAt', () => {
          describe('when params contains timestamp', () => {
            it('sets position closedAt to timestamp param', async () => {
              const timestamp = chance.date()
              const manager = new PositionManager({ trader, positions: [position] })
              await manager.close({ id: position.id, timestamp })

              expect(position.closedAt).to.eql(timestamp)
            })
          })

          describe('when params does not contain timestamp', () => {
            it('sets position closedAt to current time', async () => {
              const manager = new PositionManager({ trader, positions: [position] })
              await manager.close({ id: position.id })

              expect(position.closedAt).to.be.closeToTime(new Date(), 1)
            })
          })
        })
      })

      describe('when offset base quantity is for less than Market minimum amount', () => {
        const market = Factory('market').build({ limits: { amount: { min: 0.001 } } })

        let exchange

        beforeEach(() => {
          const buyOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entries[0], ['exchange', 'market', 'type', 'price', 'quoteQuantity']),
              side: OrderOptions.sides.BUY
            },
            status: Order.statuses.FILLED,
            side: OrderOptions.sides.BUY,
            ..._.pick(position.entries[0], ['exchange', 'market', 'type', 'price']),
            baseQuantityGross: '100',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1000',
            quoteQuantityNet: '1000',
            averagePrice: '10',
            closedAt: moment().utc().subtract(5, 'minutes').toDate()
          })

          const sellOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entries[0], ['exchange', 'market']),
              type: OrderOptions.types.LIMIT,
              side: OrderOptions.sides.SELL,
              price: 20.00,
              baseQuantity: 99.9
            },
            status: Order.statuses.FILLED,
            ..._.pick(position.entries[0], ['exchange', 'market']),
            type: OrderOptions.types.LIMIT,
            side: OrderOptions.sides.SELL,
            price: 20.00,
            averagePrice: 20.00,
            baseQuantityGross: '99.8991',
            baseQuantityNet: '99.8991',
            quoteQuantityGross: '1997.98', // 1997.982, Rounded down
            quoteQuantityNet: '1995.98', // 1995.984018 after fees, rounded down
            closedAt: moment().utc().subtract(5, 'minutes').toDate()
          })

          position.set({ orders: [buyOrder, sellOrder] })

          exchange = new Exchange({
            markets: [market],
            balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })]
          })

          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
        })

        it('does not create an offset order', async () => {
          const manager = new PositionManager({
            trader: { on: () => {}, emitAsync: () => {}, exchange },
            positions: [position]
          })
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
              ..._.pick(position.entries[0], ['exchange', 'market', 'type', 'price', 'quoteQuantity']),
              side: OrderOptions.sides.BUY
            },
            status: Order.statuses.FILLED,
            side: OrderOptions.sides.BUY,
            ..._.pick(position.entries[0], ['exchange', 'market', 'type', 'price']),
            baseQuantityGross: '100',
            baseQuantityNet: '99.9',
            quoteQuantityGross: '1000',
            quoteQuantityNet: '1000',
            averagePrice: '10',
            closedAt: moment().utc().subtract(5, 'minutes').toDate()
          })

          const sellOrder = new Order({
            foreignId: chance.guid({ version: 4 }),
            options: {
              ..._.pick(position.entries[0], ['exchange', 'market']),
              type: OrderOptions.types.LIMIT,
              side: OrderOptions.sides.SELL,
              price: 20.00,
              baseQuantity: 99.9
            },
            status: Order.statuses.FILLED,
            ..._.pick(position.entries[0], ['exchange', 'market']),
            type: OrderOptions.types.LIMIT,
            side: OrderOptions.sides.SELL,
            price: 20.00,
            averagePrice: 20.00,
            baseQuantityGross: '99.89',
            baseQuantityNet: '99.89',
            quoteQuantityGross: '1997.8',
            quoteQuantityNet: '1995.80', // 1995.8022 after fees, rounded down
            closedAt: moment().utc().subtract(5, 'minutes').toDate()
          })

          position.set({ orders: [buyOrder, sellOrder] })

          exchange = new Exchange({
            markets: [market],
            balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })]
          })

          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
        })

        it('does not create an offset order', async () => {
          const manager = new PositionManager({
            trader: { on: () => {}, emitAsync: () => {}, exchange },
            positions: [position]
          })
          await manager.close({ id: position.id })

          expect(position.orders.length).to.eql(2)
        })
      })
    })

    describe('events', () => {
      let position
      let trader
      let traderEmitStub

      beforeEach(() => {
        const exchange = new Exchange({
          balances: [new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 })]
        })

        exchange.setTick(defaultTick)
        exchange.setCandle(defaultCandle)

        position = Factory('position').build()

        trader = { on: () => {}, emitAsync: () => {}, exchange }
        traderEmitStub = sinon.stub(trader, 'emitAsync')
      })

      afterEach(() => traderEmitStub.restore())

      describe('position.updated', () => {
        describe('when there is an error', () => {
          it('does not emit position.updated', async () => {
            let thrownErr = null

            const manager = new PositionManager({
              trader: { ...trader, exchange: { cancelOrder: () => { throw new Error('cancelOrder error') } } },
              positions: [position]
            })

            try {
              await manager.close()
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.data[0].message).to.eql('id is required')

            expect(traderEmitStub).not.to.have.been.calledWith('position.updated', position)
          })
        })

        describe('when there is no error', () => {
          it('emits position.updated with position', async () => {
            const manager = new PositionManager({ trader, positions: [position] })
            await manager.close({ id: position.id })

            expect(traderEmitStub).to.have.been.calledWith('position.updated', position)
          })
        })
      })
    })
  })
})
