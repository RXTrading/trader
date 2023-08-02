const { expect, Factory, BigNumber, chance, sinon } = require('../helpers')

const PositionManager = require('../../lib/positionManager')
const { Balance, Position, Order } = require('../../lib/models')
const Exchange = require('../../lib/exchanges/simulation')

describe('PositionManager', () => {
  describe('#closeAll', () => {
    const market = Factory('market').build()
    const positions = []
    const exchangeOrders = []
    const orders = []

    let initialBaseBalance = 0

    beforeEach(() => {
      for (let i = 0; i < 3; i++) {
        const exchangeOrder = Factory('exchangeOrder').build({
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

        exchangeOrders.push(exchangeOrder)

        const order = Factory('orderFromExchangeOrder').build(exchangeOrder)

        orders.push(order)

        const position = new Position({
          exchange: 'binance',
          market: market.symbol,
          status: Position.statuses.OPEN,
          type: Position.types.LONG,
          entry: {
            exchange: 'binance',
            market: market.symbol,
            type: Order.types.LIMIT,
            price: 10,
            quoteQuantity: 1000.00
          },
          orders: [order]
        })

        positions.push(position)
      }

      initialBaseBalance = positions.reduce((total, position) => {
        return total.plus(position.orders[0].baseQuantityNet)
      }, BigNumber(0))
    })

    afterEach(() => {
      positions.length = 0
      orders.length = 0
    })

    describe('when closing positions is successful', () => {
      let exchange
      let trader
      let traderEmitStub

      beforeEach(() => {
        exchange = new Exchange({
          markets: [market],
          balances: [new Balance({
            symbol: 'BTC',
            free: initialBaseBalance.toFixed(),
            total: initialBaseBalance.toFixed()
          })],
          orders: exchangeOrders
        })

        exchange.setTick(20)
        exchange.setCandle({ open: 12, high: 22, low: 10, close: 20 })

        trader = { on: () => {}, emitAsync: () => {}, exchange }
        traderEmitStub = sinon.stub(trader, 'emitAsync')
      })

      afterEach(() => traderEmitStub.restore())

      it('starts closing all OPEN positions', async () => {
        const manager = new PositionManager({ trader, positions })
        await manager.closeAll()

        const baseBalance = exchange.balances.find(balance => balance.symbol === market.base)
        const quoteBalance = exchange.balances.find(balance => balance.symbol === market.quote)
        const expectedQuoteBalance = positions.reduce((total, position) => {
          return total.plus(position.orders[1].quoteQuantityNet)
        }, BigNumber(0)).toFixed()

        positions.forEach(position => {
          expect(position.status).to.eql(Position.statuses.CLOSING)
          expect(position.orders.length).to.eql(2)
          expect(position.orders[1].status).to.eql(Order.statuses.FILLED)
          expect(position.orders[1].side).to.eql(Order.sides.SELL)
        })

        expect(baseBalance.free).to.eql(BigNumber(0).toFixed())
        expect(baseBalance.used).to.eql(BigNumber(0).toFixed())
        expect(baseBalance.total).to.eql(BigNumber(0).toFixed())
        expect(quoteBalance.free).to.eql(expectedQuoteBalance)
        expect(quoteBalance.used).to.eql(BigNumber(0).toFixed())
        expect(quoteBalance.total).to.eql(expectedQuoteBalance)
      })

      it('forwards params for closing each position', async () => {
        const timestamp = chance.date()
        const manager = new PositionManager({ trader, positions })

        await manager.closeAll({ timestamp })

        positions.forEach(position => {
          expect(position.orders[1].timestamp).to.eql(timestamp)
        })
      })

      it('emits position.updated for each position', async () => {
        const manager = new PositionManager({ trader, positions })
        await manager.closeAll()

        expect(traderEmitStub).to.have.been.calledThrice()
        expect(traderEmitStub).to.have.been.calledWith('position.updated', positions[0])
        expect(traderEmitStub).to.have.been.calledWith('position.updated', positions[1])
        expect(traderEmitStub).to.have.been.calledWith('position.updated', positions[2])
      })
    })

    describe('when closing a position fails', () => {
      it('throws an error', async () => {
        const exchange = new Exchange({
          markets: [market],
          balances: [new Balance({
            symbol: 'BTC',
            free: initialBaseBalance.toFixed(),
            total: initialBaseBalance.toFixed()
          })],
          orders: exchangeOrders
        })

        const manager = new PositionManager({
          trader: {
            on: () => {},
            exchange: { createOrder: () => { throw new Error('createOrder error') } }
          },
          positions
        })

        exchange.setTick(200)
        exchange.setCandle({ open: 150, high: 220, low: 100, close: 200 })

        let thrownErr = null

        try {
          await manager.closeAll()
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.message).to.eql('createOrder error')
      })
    })
  })
})
