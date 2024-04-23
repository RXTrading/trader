const { expect, BigNumber, Factory, behaviours, sinon, moment } = require('../../helpers')

const PositionManager = require('../../../lib/positionManager')
const { Balance, ExchangeOrder, OrderOptions } = require('../../../lib/models')
const Exchange = require('../../../lib/exchanges/simulation')

describe('PositionManager', () => {
  describe('#evaluate exit orders', () => {
    const timestamp = moment().utc().subtract(5, 'minutes').toDate()
    const market = Factory('market').build()

    describe('when position entry order is FILLED', () => {
      let exchangeOrder
      let entryOrder

      beforeEach(() => {
        exchangeOrder = Factory('exchangeOrder').build({
          market: market.symbol,
          status: ExchangeOrder.statuses.FILLED,
          side: OrderOptions.sides.BUY,
          type: OrderOptions.types.LIMIT,
          price: 10,
          averagePrice: 10,
          quoteQuantity: 1000,
          baseQuantityGross: 100,
          baseQuantityNet: 99.9,
          quoteQuantityGross: 1000,
          quoteQuantityNet: 1000,
          closedAt: timestamp
        })

        entryOrder = Factory('orderFromExchangeOrder').build(exchangeOrder, { quoteQuantity: 1000 })
      })

      describe('and exit order configuration is provided', () => {
        let exchange

        beforeEach(() => {
          exchange = new Exchange({
            markets: [market],
            balances: [
              new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 }),
              new Balance({ symbol: 'USDT' })
            ],
            orders: [exchangeOrder]
          })
        })

        describe('and there are no existing matching exit orders', () => {
          describe('order', () => {
            let position
            let manager

            beforeEach(() => {
              position = Factory('position').build({
                orders: [entryOrder],
                exits: [
                  {
                    exchange: 'binance',
                    market: market.symbol,
                    type: OrderOptions.types.STOP_LOSS,
                    baseQuantity: '($map(entries.averagePrice, $number) ~> $sum) * 0.5',
                    stopPrice: '($map(entries.averagePrice, $number) ~> $sum) * 0.99'
                  },
                  {
                    exchange: 'binance',
                    market: market.symbol,
                    type: OrderOptions.types.STOP_LOSS,
                    baseQuantity: '($map(entries.averagePrice, $number) ~> $sum) * 0.5',
                    stopPrice: '($map(entries.averagePrice, $number) ~> $sum) * 0.98'
                  }
                ]
              })

              manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
            })

            it('creates the exit orders', async () => {
              exchange.setTick(10)
              exchange.setCandle({ timestamp, open: 9, high: 12, low: 8, close: 11 })

              try {
                exchange.evaluate()
                await manager.evaluate()
              } catch (err) {
                console.log('err', err)
              }

              expect(position.orders.length).to.eql(3)
            })
          })

          describe('when creating the orders throws an error', () => {
            let createStub
            let position
            let manager

            beforeEach(() => {
              createStub = sinon.stub(exchange, 'createOrder').throws(new Error('Something went wrong creating the order'))

              position = Factory('position').build({
                orders: [entryOrder],
                exits: [
                  {
                    exchange: 'binance',
                    market: market.symbol,
                    type: OrderOptions.types.STOP_LOSS,
                    baseQuantity: '($map(entries.averagePrice, $number) ~> $sum) * 0.5',
                    stopPrice: '($map(entries.averagePrice, $number) ~> $sum) * 0.99'
                  },
                  {
                    exchange: 'binance',
                    market: market.symbol,
                    type: OrderOptions.types.STOP_LOSS,
                    baseQuantity: '($map(entries.averagePrice, $number) ~> $sum) * 0.5',
                    stopPrice: '($map(entries.averagePrice, $number) ~> $sum) * 0.98'
                  }
                ]
              })

              manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
            })

            afterEach(() => {
              createStub.restore()
            })

            behaviours.throws('should throw an error', undefined, {
              check: async () => {
                exchange.setTick(10)
                exchange.setCandle({ timestamp, open: 9, high: 12, low: 8, close: 11 })
                exchange.evaluate()

                await manager.evaluate()
              },
              expect: error => expect(error.message).to.eql('Something went wrong creating the order')
            })
          })

          describe('and there is one exit order', () => {
            let position
            let manager

            beforeEach(() => {
              position = Factory('position').build({
                orders: [entryOrder],
                exits: [
                  {
                    exchange: 'binance',
                    market: market.symbol,
                    side: OrderOptions.sides.SELL,
                    type: OrderOptions.types.STOP_LOSS,
                    baseQuantity: '($map(entries.averagePrice, $number) ~> $sum) * 0.33',
                    stopPrice: '($map(entries.averagePrice, $number) ~> $sum) * 0.99'
                  }
                ]
              })

              manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
            })

            it('automaticaly sets baseQuantity to the baseQuantityNet of the entry', async () => {
              exchange.setTick(10)
              exchange.setCandle({ timestamp, open: 9, high: 12, low: 8, close: 11 })

              exchange.evaluate()
              await manager.evaluate()

              const exitOrder = position.orders[1]

              expect(position.orders.length).to.eql(2)
              expect(exitOrder.options.baseQuantity).to.eql(BigNumber(99.9).toFixed())
            })
          })

          describe('and there is more than one exit order', () => {
            let position
            let manager

            beforeEach(() => {
              position = Factory('position').build({
                orders: [entryOrder],
                exits: [
                  {
                    exchange: 'binance',
                    market: market.symbol,
                    side: OrderOptions.sides.SELL,
                    type: OrderOptions.types.STOP_LOSS,
                    baseQuantity: '($map(entries.averagePrice, $number) ~> $sum) * 0.5',
                    stopPrice: '($map(entries.averagePrice, $number) ~> $sum) * 0.99'
                  },
                  {
                    exchange: 'binance',
                    market: market.symbol,
                    side: OrderOptions.sides.SELL,
                    type: OrderOptions.types.STOP_LOSS,
                    baseQuantity: '($map(entries.averagePrice, $number) ~> $sum) * 0.2',
                    stopPrice: '($map(entries.averagePrice, $number) ~> $sum) * 0.98'
                  }
                ]
              })

              manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
            })

            it('automaticaly sets last exits baseQuantity to any unallocated baseQuantityNet', async () => {
              exchange.setTick(10)
              exchange.setCandle({ timestamp, open: 9, high: 12, low: 8, close: 11 })

              exchange.evaluate()
              await manager.evaluate()

              const basePrecision = market.precision.amount
              const exitOrders = position.orders.slice(1, 3)

              const expectedAmount = BigNumber(entryOrder.baseQuantityNet).minus(
                exitOrders[0].options.baseQuantity
              ).toFixed(basePrecision, BigNumber.ROUND_DOWN)

              expect(exitOrders[1].options.baseQuantity).to.eql(BigNumber(expectedAmount).toFixed())
            })
          })
        })

        describe('and there are existing matching exit orders', () => {
          let position
          let manager

          beforeEach(() => {
            position = Factory('position').build({
              orders: [entryOrder],
              exits: [
                {
                  exchange: 'binance',
                  market: market.symbol,
                  side: OrderOptions.sides.SELL,
                  type: OrderOptions.types.STOP_LOSS,
                  baseQuantity: '($map(entries.averagePrice, $number) ~> $sum) * 0.5',
                  stopPrice: '($map(entries.averagePrice, $number) ~> $sum) * 0.95'
                },
                {
                  exchange: 'binance',
                  market: market.symbol,
                  side: OrderOptions.sides.SELL,
                  type: OrderOptions.types.STOP_LOSS,
                  baseQuantity: '($map(entries.averagePrice, $number) ~> $sum) * 0.2',
                  stopPrice: '($map(entries.averagePrice, $number) ~> $sum) * 0.98'
                }
              ]
            })

            manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
          })

          it('does not create new orders', async () => {
            exchange.setTick(10)
            exchange.setCandle({ timestamp, open: 9, high: 12, low: 8, close: 11 })

            exchange.evaluate()

            expect(position.orders.length).to.eql(1)

            await manager.evaluate()

            expect(position.orders.length).to.eql(3)

            await manager.evaluate()

            expect(position.orders.length).to.eql(3)
          })
        })
      })

      describe('and no exit order configuration is provided', () => {
        let exchange
        let position
        let manager

        beforeEach(() => {
          exchange = new Exchange({
            markets: [market],
            balances: [
              new Balance({ symbol: 'BTC', free: 99.9, used: 0, total: 99.9 }),
              new Balance({ symbol: 'USDT' })
            ],
            orders: [exchangeOrder]
          })

          position = Factory('position').build({ orders: [entryOrder], exit: [] })

          manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
        })

        it('does not create any exit orders', async () => {
          exchange.setTick(10)
          exchange.setCandle({ timestamp, open: 9, high: 12, low: 8, close: 11 })

          exchange.evaluate()

          expect(position.orders.length).to.eql(1)
          expect(position.orders.length).to.eql(1)

          await manager.evaluate()

          expect(position.orders.length).to.eql(1)
          expect(position.orders.length).to.eql(1)
        })
      })
    })

    describe('when position entry order is not FILLED', () => {
      let exchange
      let position
      let manager

      beforeEach(() => {
        const exchangeOrder = Factory('exchangeOrder').build({
          market: market.symbol,
          status: ExchangeOrder.statuses.OPEN,
          side: OrderOptions.sides.BUY,
          type: OrderOptions.types.LIMIT,
          price: 5,
          averagePrice: 10,
          quoteQuantity: 1000,
          baseQuantityGross: 100,
          baseQuantityNet: 99.9,
          quoteQuantityGross: 1000,
          quoteQuantityNet: 1000
        })

        const entryOrder = Factory('orderFromExchangeOrder').build(exchangeOrder)

        exchange = new Exchange({
          markets: [market],
          balances: [
            new Balance({ symbol: 'BTC' }),
            new Balance({ symbol: 'USDT', free: 0, used: 1000, total: 1000 })
          ],
          orders: [exchangeOrder]
        })

        position = Factory('position').build({
          orders: [entryOrder],
          exits: [
            {
              exchange: 'binance',
              market: market.symbol,
              side: OrderOptions.sides.SELL,
              type: OrderOptions.types.STOP_LOSS,
              baseQuantity: '$number(entry.baseQuantityNet) * 0.5',
              stopPrice: '$number(entry.averagePrice) * 0.99'
            },
            {
              exchange: 'binance',
              market: market.symbol,
              side: OrderOptions.sides.SELL,
              type: OrderOptions.types.STOP_LOSS,
              baseQuantity: '$number(entry.baseQuantityNet) * 0.2',
              stopPrice: '$number(entry.averagePrice) * 0.98'
            }
          ]
        })

        manager = new PositionManager({ trader: { on: () => {}, emitAsync: () => {}, exchange }, positions: [position] })
      })

      it('does not create any exit orders', async () => {
        exchange.setTick(10)
        exchange.setCandle({ timestamp, open: 9, high: 12, low: 8, close: 11 })

        exchange.evaluate()

        expect(position.orders.length).to.eql(1)
        expect(position.orders.length).to.eql(1)

        await manager.evaluate()

        expect(position.orders.length).to.eql(1)
        expect(position.orders.length).to.eql(1)
      })
    })
  })
})
