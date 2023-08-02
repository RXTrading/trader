const { expect, Factory, chance, BigNumber } = require('../../helpers')

const Exchange = require('../../../lib/exchanges/simulation')
const { Balance, ExchangeOrder } = require('../../../lib/models')

describe('Exchanges: Simulation', () => {
  describe('#evaluate', () => {
    const defaultCandle = {
      open: chance.floating({ min: 30, max: 50 }),
      high: chance.floating({ min: 90, max: 100 }),
      low: chance.floating({ min: 10, max: 30 }),
      close: chance.floating({ min: 70, max: 90 })
    }
    const defaultTick = chance.floating({ min: defaultCandle.low, max: defaultCandle.high })

    describe('when no tick is set', () => {
      it('throws an error', () => {
        const exchange = new Exchange()

        let thrownErr = null

        exchange.setCandle(defaultCandle)

        try {
          exchange.evaluate()
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('SIMULATION_EXCHANGE_ERROR')
        expect(thrownErr.message).to.eql('tick and candle should be set with setTick() and setCandle()')
      })
    })

    describe('when no candle is set', () => {
      it('throws an error', () => {
        const exchange = new Exchange()

        let thrownErr = null

        exchange.setTick(defaultTick)

        try {
          exchange.evaluate()
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('SIMULATION_EXCHANGE_ERROR')
        expect(thrownErr.message).to.eql('tick and candle should be set with setTick() and setCandle()')
      })
    })

    describe('for all FILLED and CANCELLED orders', () => {
      it('does nothing', () => {
        const market = Factory('market').build({ symbol: 'BTC/USDT' })
        const balances = [
          new Balance({ symbol: market.base, free: 1, used: 0, total: 1 }),
          new Balance({ symbol: market.quote, free: 1000, used: 0, total: 1000 })
        ]
        const exchange = new Exchange({
          markets: [market],
          balances,
          orders: [
            Factory('exchangeOrder').build({ status: ExchangeOrder.statuses.CANCELLED }),
            Factory('exchangeOrder').build({ status: ExchangeOrder.statuses.FILLED })
          ]
        })

        expect(balances[0]).to.deep.include({ free: '1', used: '0', total: '1' })
        expect(balances[1]).to.deep.include({ free: '1000', used: '0', total: '1000' })

        exchange.setTick(defaultTick)
        exchange.setCandle(defaultCandle)

        exchange.evaluate({
          tick: chance.floating({ min: 0, max: 100 }),
          candle: {
            open: chance.floating({ min: 30, max: 50 }),
            high: chance.floating({ min: 90, max: 100 }),
            low: chance.floating({ min: 10, max: 30 }),
            close: chance.floating({ min: 70, max: 90 })
          }
        })

        expect(balances[0]).to.deep.include({ free: '1', used: '0', total: '1' })
        expect(balances[1]).to.deep.include({ free: '1000', used: '0', total: '1000' })
      })
    })

    describe('when side is BUY', () => {
      const market = Factory('market').build({ symbol: 'BTC/USDT' })
      let exchange

      beforeEach(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 1000, used: 0, total: 1000 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]

        exchange = new Exchange({ markets: [market], balances })
        exchange.setTick(defaultTick)
        exchange.setCandle(defaultCandle)
      })

      describe('fees', () => {
        const balances = [
          new Balance({ symbol: market.base, free: 1, used: 0, total: 1 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]
        const orderOptions = {
          exchange: 'binance',
          market: market.symbol,
          side: ExchangeOrder.sides.BUY,
          type: ExchangeOrder.types.LIMIT,
          price: defaultTick,
          quoteQuantity: chance.floating({ min: 1000, max: 100000 })
        }

        it('calculated correctly', () => {
          const exchange = new Exchange({ markets: [market], balances })
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
          exchange.createOrder(orderOptions)
          exchange.evaluate()

          const updatedOrder = exchange.getOrders()[0]
          const trade = updatedOrder.trades[0]

          const expectedCost = BigNumber(trade.baseQuantityGross).multipliedBy(
            market.fees.maker
          ).toFixed()

          expect(trade.fee).to.eql({ currency: market.base, cost: expectedCost })
        })
      })

      describe('and options.baseQuantity is provided', () => {
        const balances = [
          new Balance({ symbol: market.base, free: 100, used: 0, total: 100 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]
        const orderOptions = {
          exchange: 'binance',
          market: market.symbol,
          side: ExchangeOrder.sides.BUY,
          type: ExchangeOrder.types.LIMIT,
          price: defaultTick,
          baseQuantity: chance.floating({ min: 10, max: 100 })
        }
        const exchange = new Exchange({ markets: [market], balances })

        it('calculates quantities correctly', () => {
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)

          exchange.createOrder(orderOptions)
          exchange.evaluate()

          const updatedOrder = exchange.getOrders()[0]
          const trade = updatedOrder.trades[0]

          const basePrecision = market.precision.amount
          const quotePrecision = market.precision.price

          const expectedBaseGross = BigNumber(orderOptions.baseQuantity).toFixed(basePrecision, BigNumber.ROUND_DOWN)
          const feeCost = BigNumber(expectedBaseGross).multipliedBy(market.fees.maker).toFixed()
          const expectedBaseNet = BigNumber(expectedBaseGross).minus(feeCost).toFixed(basePrecision, BigNumber.ROUND_DOWN)
          const expectedQuote = BigNumber(orderOptions.baseQuantity).multipliedBy(updatedOrder.averagePrice).toFixed(quotePrecision, BigNumber.ROUND_UP)

          expect(trade.baseQuantityGross).to.eql(BigNumber(expectedBaseGross).toFixed())
          expect(trade.baseQuantityNet).to.eql(BigNumber(expectedBaseNet).toFixed())
          expect(trade.quoteQuantityGross).to.eql(BigNumber(expectedQuote).toFixed())
          expect(trade.quoteQuantityNet).to.eql(BigNumber(expectedQuote).toFixed())

          expect(updatedOrder.baseQuantityGross).to.eql(BigNumber(expectedBaseGross).toFixed())
          expect(updatedOrder.baseQuantityNet).to.eql(BigNumber(expectedBaseNet).toFixed())
          expect(updatedOrder.quoteQuantityGross).to.eql(BigNumber(expectedQuote).toFixed())
          expect(updatedOrder.quoteQuantityNet).to.eql(BigNumber(expectedQuote).toFixed())
        })
      })

      describe('and when options.quoteQuantity is provided', () => {
        const balances = [
          new Balance({ symbol: market.base, free: 1, used: 0, total: 1 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]
        const orderOptions = {
          exchange: 'binance',
          market: market.symbol,
          side: ExchangeOrder.sides.BUY,
          type: ExchangeOrder.types.LIMIT,
          price: defaultTick,
          quoteQuantity: chance.floating({ min: 100, max: 1000 })
        }
        const exchange = new Exchange({ markets: [market], balances })

        it('calculates quantities correctly', () => {
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
          exchange.createOrder(orderOptions)
          exchange.evaluate()

          const updatedOrder = exchange.getOrders()[0]
          const trade = updatedOrder.trades[0]

          const basePrecision = market.precision.amount
          const quotePrecision = market.precision.price

          const expectedBaseGross = BigNumber(orderOptions.quoteQuantity).dividedBy(updatedOrder.averagePrice).toFixed(basePrecision, BigNumber.ROUND_DOWN)
          const feeCost = BigNumber(expectedBaseGross).multipliedBy(market.fees.maker).toFixed()
          const expectedBaseNet = BigNumber(expectedBaseGross).minus(feeCost).toFixed(basePrecision, BigNumber.ROUND_DOWN)
          const expectedQuote = BigNumber(
            expectedBaseGross
          ).multipliedBy(updatedOrder.averagePrice).toFixed(quotePrecision, BigNumber.ROUND_UP)

          expect(trade.baseQuantityGross).to.eql(BigNumber(expectedBaseGross).toFixed())
          expect(trade.baseQuantityNet).to.eql(BigNumber(expectedBaseNet).toFixed())
          expect(trade.quoteQuantityGross).to.eql(BigNumber(expectedQuote).toFixed())
          expect(trade.quoteQuantityNet).to.eql(BigNumber(expectedQuote).toFixed())

          expect(updatedOrder.baseQuantityGross).to.eql(BigNumber(expectedBaseGross).toFixed())
          expect(updatedOrder.baseQuantityNet).to.eql(BigNumber(expectedBaseNet).toFixed())
          expect(updatedOrder.quoteQuantityGross).to.eql(BigNumber(expectedQuote).toFixed())
          expect(updatedOrder.quoteQuantityNet).to.eql(BigNumber(expectedQuote).toFixed())
        })
      })
    })

    describe('when side is SELL', () => {
      const market = Factory('market').build({ symbol: 'BTC/USDT' })
      let exchange

      beforeEach(() => {
        const balances = [
          new Balance({ symbol: market.base, free: 1000, used: 0, total: 1000 }),
          new Balance({ symbol: market.quote, free: 100000, used: 0, total: 100000 })
        ]

        exchange = new Exchange({ markets: [market], balances })
        exchange.setTick(defaultTick)
        exchange.setCandle(defaultCandle)
      })

      describe('fees', () => {
        const balances = [
          new Balance({ symbol: market.base, free: 100, used: 0, total: 100 }),
          new Balance({ symbol: market.quote, free: 1000, used: 0, total: 1000 })
        ]
        const orderOptions = {
          exchange: 'binance',
          market: market.symbol,
          side: ExchangeOrder.sides.SELL,
          type: ExchangeOrder.types.LIMIT,
          price: defaultTick,
          baseQuantity: chance.floating({ min: 10, max: 100 })
        }
        const exchange = new Exchange({ markets: [market], balances })

        it('calculated correctly', () => {
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
          exchange.createOrder(orderOptions)
          exchange.evaluate()

          const updatedOrder = exchange.getOrders()[0]
          const trade = updatedOrder.trades[0]

          const expectedCost = BigNumber(trade.quoteQuantityGross).multipliedBy(
            market.fees.maker
          ).toFixed()

          expect(trade.fee).to.eql({ currency: market.quote, cost: expectedCost })
        })
      })

      describe('and options.baseQuantity is provided', () => {
        const balances = [
          new Balance({ symbol: market.base, free: 100, used: 0, total: 100 }),
          new Balance({ symbol: market.quote, free: 1000, used: 0, total: 1000 })
        ]
        const orderOptions = {
          exchange: 'binance',
          market: market.symbol,
          side: ExchangeOrder.sides.SELL,
          type: ExchangeOrder.types.LIMIT,
          price: defaultTick,
          baseQuantity: chance.floating({ min: 10, max: 100 })
        }
        const exchange = new Exchange({ markets: [market], balances })

        it('calculates quantities correctly', () => {
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
          exchange.createOrder(orderOptions)
          exchange.evaluate()

          const updatedOrder = exchange.getOrders()[0]
          const trade = updatedOrder.trades[0]

          const basePrecision = market.precision.amount
          const quotePrecision = market.precision.price

          const expectedBase = BigNumber(orderOptions.baseQuantity).toFixed(basePrecision, BigNumber.ROUND_DOWN)
          const expectedQuoteNet = BigNumber(orderOptions.baseQuantity).multipliedBy(updatedOrder.averagePrice).toFixed(quotePrecision, BigNumber.ROUND_UP)
          const feeCost = BigNumber(expectedQuoteNet).multipliedBy(market.fees.maker).toFixed()
          const expectedQuoteGross = BigNumber(expectedQuoteNet).minus(feeCost).toFixed(quotePrecision, BigNumber.ROUND_UP)

          expect(trade.baseQuantityGross).to.eql(BigNumber(expectedBase).toFixed())
          expect(trade.baseQuantityNet).to.eql(BigNumber(expectedBase).toFixed())
          expect(trade.quoteQuantityGross).to.eql(BigNumber(expectedQuoteNet).toFixed())
          expect(trade.quoteQuantityNet).to.eql(BigNumber(expectedQuoteGross).toFixed())

          expect(updatedOrder.baseQuantityGross).to.eql(BigNumber(expectedBase).toFixed())
          expect(updatedOrder.baseQuantityNet).to.eql(BigNumber(expectedBase).toFixed())
          expect(updatedOrder.quoteQuantityGross).to.eql(BigNumber(expectedQuoteNet).toFixed())
          expect(updatedOrder.quoteQuantityNet).to.eql(BigNumber(expectedQuoteGross).toFixed())
        })
      })

      describe('and options.quoteQuantity is provided', () => {
        const balances = [
          new Balance({ symbol: market.base, free: 100, used: 0, total: 100 }),
          new Balance({ symbol: market.quote, free: 1000, used: 0, total: 1000 })
        ]
        const orderOptions = {
          exchange: 'binance',
          market: market.symbol,
          side: ExchangeOrder.sides.SELL,
          type: ExchangeOrder.types.LIMIT,
          price: defaultTick,
          quoteQuantity: chance.floating({ min: 100, max: 1000 })
        }
        const exchange = new Exchange({ markets: [market], balances })

        it('calculates quantities correctly', () => {
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
          exchange.createOrder(orderOptions)
          exchange.evaluate()

          const updatedOrder = exchange.getOrders()[0]
          const trade = updatedOrder.trades[0]

          const basePrecision = market.precision.amount
          const quotePrecision = market.precision.price

          const expectedBase = BigNumber(orderOptions.quoteQuantity).dividedBy(updatedOrder.averagePrice).toFixed(basePrecision, BigNumber.ROUND_DOWN)
          const expectedQuoteNet = BigNumber(expectedBase).multipliedBy(updatedOrder.averagePrice).toFixed(quotePrecision, BigNumber.ROUND_UP)
          const feeCost = BigNumber(expectedQuoteNet).multipliedBy(market.fees.maker).toFixed()
          const expectedQuoteGross = BigNumber(expectedQuoteNet).minus(feeCost).toFixed(quotePrecision, BigNumber.ROUND_UP)

          expect(trade.baseQuantityGross).to.eql(BigNumber(expectedBase).toFixed())
          expect(trade.baseQuantityNet).to.eql(BigNumber(expectedBase).toFixed())
          expect(trade.quoteQuantityGross).to.eql(BigNumber(expectedQuoteNet).toFixed())
          expect(trade.quoteQuantityNet).to.eql(BigNumber(expectedQuoteGross).toFixed())

          expect(updatedOrder.baseQuantityGross).to.eql(BigNumber(expectedBase).toFixed())
          expect(updatedOrder.baseQuantityNet).to.eql(BigNumber(expectedBase).toFixed())
          expect(updatedOrder.quoteQuantityGross).to.eql(BigNumber(expectedQuoteNet).toFixed())
          expect(updatedOrder.quoteQuantityNet).to.eql(BigNumber(expectedQuoteGross).toFixed())
        })
      })
    })

    describe('balances', () => {
      const market = Factory('market').build({ symbol: 'BTC/USDT' })

      describe('when a balance for market does not exist', () => {
        describe('base symbol', () => {
          const balances = [
            new Balance({ symbol: market.quote, free: 1000, used: 0, total: 1000 })
          ]
          const orderOptions = {
            exchange: 'binance',
            market: market.symbol,
            side: ExchangeOrder.sides.BUY,
            type: ExchangeOrder.types.LIMIT,
            price: defaultTick,
            quoteQuantity: chance.floating({ min: 100, max: 1000 })
          }
          const exchange = new Exchange({ markets: [market], balances })

          it('creates the balance', () => {
            expect(exchange.getBalance(market.base)).to.eql(undefined)

            exchange.setTick(defaultTick)
            exchange.setCandle(defaultCandle)
            exchange.createOrder(orderOptions)
            exchange.evaluate()

            expect(exchange.getBalance(market.base)).not.to.eql(undefined)
          })
        })

        describe('quote symbol', () => {
          const balances = [
            new Balance({ symbol: market.base, free: 1000, used: 0, total: 1000 })
          ]
          const orderOptions = {
            exchange: 'binance',
            market: market.symbol,
            side: ExchangeOrder.sides.SELL,
            type: ExchangeOrder.types.LIMIT,
            price: defaultTick,
            quoteQuantity: chance.floating({ min: 100, max: 1000 })
          }
          const exchange = new Exchange({ markets: [market], balances })

          it('creates the balance', () => {
            expect(exchange.getBalance(market.quote)).to.eql(undefined)

            exchange.setTick(defaultTick)
            exchange.setCandle(defaultCandle)
            exchange.createOrder(orderOptions)
            exchange.evaluate()

            expect(exchange.getBalance(market.quote)).not.to.eql(undefined)
          })
        })
      })

      describe('when side is BUY', () => {
        const baseBalance = { symbol: market.base, free: 0, used: 0, total: 0 }
        const quoteBalance = { symbol: market.quote, free: 100000, used: 0, total: 100000 }
        const balances = [new Balance(baseBalance), new Balance(quoteBalance)]
        const orderOptions = {
          exchange: 'binance',
          market: market.symbol,
          side: ExchangeOrder.sides.BUY,
          type: ExchangeOrder.types.LIMIT,
          price: defaultTick,
          baseQuantity: chance.floating({ min: 100, max: 1000 })
        }
        const exchange = new Exchange({ markets: [market], balances })

        it('correctly updates balance for base and quote', () => {
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
          exchange.createOrder(orderOptions)
          exchange.evaluate()

          const order = exchange.getOrders()[0]

          expect(exchange.getBalance(market.base)).to.deep.include({
            total: BigNumber(baseBalance.total).plus(order.baseQuantityNet).toFixed(),
            used: '0',
            free: BigNumber(baseBalance.total).plus(order.baseQuantityNet).toFixed()
          })

          expect(exchange.getBalance(market.quote)).to.deep.include({
            total: BigNumber(quoteBalance.total).minus(order.quoteQuantityGross).toFixed(),
            used: '0',
            free: BigNumber(quoteBalance.total).minus(order.quoteQuantityGross).toFixed()
          })
        })
      })

      describe('when side is SELL', () => {
        const baseBalance = { symbol: market.base, free: 1000, used: 0, total: 1000 }
        const quoteBalance = { symbol: market.quote, free: 1000, used: 0, total: 1000 }
        const balances = [new Balance(baseBalance), new Balance(quoteBalance)]

        const orderOptions = {
          exchange: 'binance',
          market: market.symbol,
          side: ExchangeOrder.sides.SELL,
          type: ExchangeOrder.types.LIMIT,
          price: defaultTick,
          baseQuantity: chance.floating({ min: 100, max: 1000 })
        }
        const exchange = new Exchange({ markets: [market], balances })

        it('correctly updates balance for base and quote', () => {
          exchange.setTick(defaultTick)
          exchange.setCandle(defaultCandle)
          exchange.createOrder(orderOptions)
          exchange.evaluate()

          const order = exchange.getOrders()[0]

          expect(exchange.getBalance(market.base)).to.deep.include({
            total: BigNumber(baseBalance.total).minus(order.baseQuantityGross).toFixed(),
            used: '0',
            free: BigNumber(baseBalance.total).minus(order.baseQuantityGross).toFixed()
          })

          expect(exchange.getBalance(market.quote)).to.deep.include({
            total: BigNumber(quoteBalance.total).plus(order.quoteQuantityNet).toFixed(),
            used: '0',
            free: BigNumber(quoteBalance.total).plus(order.quoteQuantityNet).toFixed()
          })
        })
      })
    })
  })
})
