const { expect, chance, Factory, behaviours } = require('../helpers')

const ExchangeOrder = require('../../lib/models/exchangeOrder')
const OrderOptions = require('../../lib/models/orderOptions')

describe('ExchangeOrder Model', () => {
  it('has statuses', () => {
    expect(ExchangeOrder.statuses).to.eql({ NEW: 'NEW', OPEN: 'OPEN', FILLED: 'FILLED', CANCELLED: 'CANCELLED' })
  })

  describe('params', () => {
    const defaultParams = {
      id: chance.guid({ version: 4 }),
      timestamp: chance.date(),
      exchange: 'binance',
      market: 'BTC/USDT',
      status: chance.pickone(Object.values(ExchangeOrder.statuses)),
      side: OrderOptions.sides.BUY,
      type: OrderOptions.types.LIMIT,
      quoteQuantity: 1000.00,
      price: 10,
      baseQuantityGross: chance.integer({ min: 1, max: 1000 }),
      baseQuantityNet: chance.integer({ min: 1, max: 1000 }),
      quoteQuantityGross: chance.integer({ min: 1, max: 1000 }),
      quoteQuantityNet: chance.integer({ min: 1, max: 1000 }),
      averagePrice: chance.integer({ min: 1, max: 100 }),
      trades: []
    }

    describe('id', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new ExchangeOrder({ ...defaultParams, id: undefined })),
        expect: error => expect(error.data[0].message).to.eql('id is required')
      })

      behaviours.throwsValidationError('must be a UUID', {
        check: () => (new ExchangeOrder({ ...defaultParams, id: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('id must be a valid UUID')
      })
    })

    describe('timestamp', () => {
      behaviours.throwsValidationError('must be a date', {
        check: () => (new ExchangeOrder({ ...defaultParams, timestamp: 'tomorrow' })),
        expect: error => expect(error.data[0].message).to.eql('timestamp must be a Date')
      })

      it('defaults to current time', () => {
        const model = new ExchangeOrder({ ...defaultParams, timestamp: undefined })

        expect(model.timestamp).not.to.be.null()
        expect(model.timestamp).be.closeToTime(new Date(), 1)
      })
    })

    describe('exchange', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new ExchangeOrder({ ...defaultParams, exchange: undefined })),
        expect: error => expect(error.data[0].message).to.eql('exchange is required')
      })

      behaviours.throwsValidationError('must be a string', {
        check: () => (new ExchangeOrder({ ...defaultParams, exchange: chance.integer() })),
        expect: error => expect(error.data[0].message).to.eql('exchange must be a string')
      })
    })

    describe('market', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new ExchangeOrder({ ...defaultParams, market: undefined })),
        expect: error => expect(error.data[0].message).to.eql('market is required')
      })

      behaviours.throwsValidationError('must be a string', {
        check: () => (new ExchangeOrder({ ...defaultParams, market: chance.integer() })),
        expect: error => expect(error.data[0].message).to.eql('market must be a string')
      })
    })

    describe('status', () => {
      behaviours.throwsValidationError('must match', {
        check: () => (new ExchangeOrder({ ...defaultParams, status: chance.string({ max: 5, aplha: true }) })),
        expect: error => expect(error.data[0].message).to.eql(`status must match one of ${Object.values(ExchangeOrder.statuses).join(', ')}`)
      })

      it('defaults to NEW', () => {
        const model = new ExchangeOrder({ ...defaultParams, status: undefined })

        expect(model.status).not.to.be.null()
        expect(model.status).be.eql(ExchangeOrder.statuses.NEW)
      })
    })

    describe('side', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new ExchangeOrder({ ...defaultParams, side: undefined })),
        expect: error => expect(error.data[0].message).to.eql('side is required')
      })

      behaviours.throwsValidationError('must match', {
        check: () => (new ExchangeOrder({ ...defaultParams, side: chance.string({ max: 5, aplha: true }) })),
        expect: error => expect(error.data[0].message).to.eql(`side must match one of ${Object.values(OrderOptions.sides).join(', ')}`)
      })
    })

    describe('type', () => {
      behaviours.throwsValidationError('is required', {
        check: () => (new ExchangeOrder({ ...defaultParams, type: undefined })),
        expect: error => expect(error.data[0].message).to.eql('type is required')
      })

      behaviours.throwsValidationError('must match', {
        check: () => (new ExchangeOrder({ ...defaultParams, type: chance.string({ max: 5, aplha: true }) })),
        expect: error => expect(error.data[0].message).to.eql(`type must match one of ${Object.values(OrderOptions.types).join(', ')}`)
      })

      describe('when side is BUY and type is a STOP', () => {
        behaviours.throwsValidationError('is not supported', {
          check: () => (
            new ExchangeOrder({
              ...defaultParams,
              side: OrderOptions.sides.BUY,
              type: OrderOptions.types.STOP_LOSS_LIMIT
            })
          ),
          expect: error => expect(error.data[0].message).to.eql('type does not support BUY')
        })
      })

      describe('when side is BUY and type is a TAKE PROFIT', () => {
        behaviours.throwsValidationError('is not supported', {
          check: () => (
            new ExchangeOrder({
              ...defaultParams,
              side: OrderOptions.sides.BUY,
              type: OrderOptions.types.TAKE_PROFIT
            })
          ),
          expect: error => expect(error.data[0].message).to.eql('type does not support BUY')
        })
      })
    })

    describe('baseQuantity', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new ExchangeOrder({ ...defaultParams, baseQuantity: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantity must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new ExchangeOrder({ ...defaultParams, baseQuantity: -1 })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantity must be greater than or equal to 0')
      })
    })

    describe('quoteQuantity', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new ExchangeOrder({ ...defaultParams, quoteQuantity: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantity must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new ExchangeOrder({ ...defaultParams, quoteQuantity: -1 })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantity must be greater than or equal to 0')
      })
    })

    describe('price', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new ExchangeOrder({ ...defaultParams, price: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('price must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new ExchangeOrder({ ...defaultParams, price: -1 })),
        expect: error => expect(error.data[0].message).to.eql('price must be greater than or equal to 0')
      })

      describe('when type has LIMIT', () => {
        behaviours.throwsValidationError('is required', {
          check: () => (
            new ExchangeOrder({
              ...defaultParams,
              type: OrderOptions.types.STOP_LOSS_LIMIT,
              side: OrderOptions.sides.SELL,
              baseQuantity: 100,
              quoteQuantity: undefined,
              price: undefined
            })
          ),
          expect: error => expect(error.data[0].message).to.eql('price is required')
        })
      })
    })

    describe('stopPrice', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new ExchangeOrder({ ...defaultParams, stopPrice: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('stopPrice must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new ExchangeOrder({ ...defaultParams, stopPrice: -1 })),
        expect: error => expect(error.data[0].message).to.eql('stopPrice must be greater than or equal to 0')
      })

      describe('when type is MARKET', () => {
        it('defaults to underfined', () => {
          const model = new ExchangeOrder({ ...defaultParams, type: 'MARKET', stopPrice: undefined })

          expect(model.stopPrice).to.undefined()
        })
      })

      describe('when type has STOP_LOSS', () => {
        behaviours.throwsValidationError('is required', {
          check: () => (
            new ExchangeOrder({
              ...defaultParams,
              type: OrderOptions.types.STOP_LOSS_LIMIT,
              side: OrderOptions.sides.SELL,
              baseQuantity: 100,
              quoteQuantity: undefined,
              stopPrice: undefined
            })
          ),
          expect: error => expect(error.data[0].message).to.eql('stopPrice is required')
        })
      })

      describe('when type has TAKE_PROFIT', () => {
        behaviours.throwsValidationError('is required', {
          check: () => (
            new ExchangeOrder({
              ...defaultParams,
              type: OrderOptions.types.TAKE_PROFIT,
              side: OrderOptions.sides.SELL,
              baseQuantity: 100,
              quoteQuantity: undefined,
              stopPrice: undefined
            })
          ),
          expect: error => expect(error.data[0].message).to.eql('stopPrice is required')
        })
      })
    })

    describe('stopPriceHit', () => {
      behaviours.throwsValidationError('must be a boolean', {
        check: () => (new ExchangeOrder({ ...defaultParams, stopPriceHit: -1 })),
        expect: error => expect(error.data[0].message).to.eql('stopPriceHit must be a boolean')
      })
    })

    describe('baseQuantityGross', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new ExchangeOrder({ ...defaultParams, baseQuantityGross: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantityGross must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new ExchangeOrder({ ...defaultParams, baseQuantityGross: -1 })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantityGross must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new ExchangeOrder({ ...defaultParams, baseQuantityGross: undefined })

        expect(model.baseQuantityGross).not.to.be.null()
        expect(model.baseQuantityGross).be.eql('0')
      })
    })

    describe('baseQuantityNet', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new ExchangeOrder({ ...defaultParams, baseQuantityNet: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantityNet must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new ExchangeOrder({ ...defaultParams, baseQuantityNet: -1 })),
        expect: error => expect(error.data[0].message).to.eql('baseQuantityNet must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new ExchangeOrder({ ...defaultParams, baseQuantityNet: undefined })

        expect(model.baseQuantityNet).not.to.be.null()
        expect(model.baseQuantityNet).be.eql('0')
      })
    })

    describe('quoteQuantityGross', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new ExchangeOrder({ ...defaultParams, quoteQuantityGross: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantityGross must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new ExchangeOrder({ ...defaultParams, quoteQuantityGross: -1 })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantityGross must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new ExchangeOrder({ ...defaultParams, quoteQuantityGross: undefined })

        expect(model.quoteQuantityGross).not.to.be.null()
        expect(model.quoteQuantityGross).be.eql('0')
      })
    })

    describe('quoteQuantityNet', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new ExchangeOrder({ ...defaultParams, quoteQuantityNet: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantityNet must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new ExchangeOrder({ ...defaultParams, quoteQuantityNet: -1 })),
        expect: error => expect(error.data[0].message).to.eql('quoteQuantityNet must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new ExchangeOrder({ ...defaultParams, quoteQuantityNet: undefined })

        expect(model.quoteQuantityNet).not.to.be.null()
        expect(model.quoteQuantityNet).be.eql('0')
      })
    })

    describe('averagePrice', () => {
      behaviours.throwsValidationError('must be a number', {
        check: () => (new ExchangeOrder({ ...defaultParams, averagePrice: 'seventy' })),
        expect: error => expect(error.data[0].message).to.eql('averagePrice must be a number')
      })

      behaviours.throwsValidationError('must be greater than or equal to 0', {
        check: () => (new ExchangeOrder({ ...defaultParams, averagePrice: -1 })),
        expect: error => expect(error.data[0].message).to.eql('averagePrice must be greater than or equal to 0')
      })

      it('defaults to 0', () => {
        const model = new ExchangeOrder({ ...defaultParams, averagePrice: undefined })

        expect(model.averagePrice).not.to.be.null()
        expect(model.averagePrice).be.eql('0')
      })
    })

    describe('trades', () => {
      behaviours.throwsValidationError('must be an array', {
        check: () => (new ExchangeOrder({ ...defaultParams, trades: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('trades must be an array')
      })

      describe('items', () => {
        behaviours.throwsValidationError('must be an instance of Trade', {
          check: () => (new ExchangeOrder({ ...defaultParams, trades: [{}] })),
          expect: error => expect(error.data[0].message).to.eql('trades[0] must be an instance of the Trade class')
        })
      })

      it('defaults to an empty array', () => {
        const model = new ExchangeOrder({ ...defaultParams, trades: undefined })

        expect(model.trades).not.to.be.null()
        expect(model.trades).be.eql([])
      })
    })
  })

  describe('.isMarketOrder', () => {
    describe('when order type is a MARKET order', () => {
      it('returns true', () => {
        const order = Factory('exchangeOrder').build({ type: OrderOptions.types.MARKET })
        expect(ExchangeOrder.isMarketOrder(order)).to.eql(true)
      })
    })

    describe('when order type is not a MARKET order', () => {
      it('returns false', () => {
        const order = Factory('exchangeOrder').build({
          type: OrderOptions.types.LIMIT,
          quoteQuantity: 10000,
          price: 100
        })

        expect(ExchangeOrder.isMarketOrder(order)).to.eql(false)
      })
    })
  })

  describe('.isLimitOrder', () => {
    describe('when order type is a LIMIT order', () => {
      it('returns true', () => {
        const order = Factory('exchangeOrder').build({
          type: OrderOptions.types.LIMIT,
          quoteQuantity: 10000,
          price: 100
        })

        expect(ExchangeOrder.isLimitOrder(order)).to.eql(true)
      })
    })

    describe('when order type is not a LIMIT order', () => {
      it('returns false', () => {
        const order = Factory('exchangeOrder').build({ type: OrderOptions.types.MARKET })

        expect(ExchangeOrder.isLimitOrder(order)).to.eql(false)
      })
    })
  })
})
