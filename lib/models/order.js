const _ = require('lodash')
const { v4: uuid } = require('uuid')

const Model = require('./base')
const Trade = require('./trade')

class Order extends Model {
  static get statuses () {
    return { NEW: 'NEW', OPEN: 'OPEN', FILLED: 'FILLED', CANCELLED: 'CANCELLED' }
  }

  static get sides () {
    return { BUY: 'BUY', SELL: 'SELL' }
  }

  static get types () {
    return {
      MARKET: 'MARKET',
      LIMIT: 'LIMIT',
      STOP_LOSS: 'STOP_LOSS',
      STOP_LOSS_LIMIT: 'STOP_LOSS_LIMIT',
      TAKE_PROFIT: 'TAKE_PROFIT',
      TAKE_PROFIT_LIMIT: 'TAKE_PROFIT_LIMIT'
    }
  }

  static get marketTypes () {
    return [
      this.types.MARKET,
      this.types.STOP_LOSS,
      this.types.TAKE_PROFIT
    ]
  }

  static get limitTypes () {
    return [
      this.types.LIMIT,
      this.types.STOP_LOSS_LIMIT,
      this.types.TAKE_PROFIT_LIMIT
    ]
  }

  static get schema () {
    return {
      id: { type: 'uuid', default: () => uuid() },
      foreignId: { type: 'uuid' },
      exitId: { type: 'uuid', optional: true },
      timestamp: { type: 'date', optional: true, default: () => new Date(), convert: true },
      options: {
        type: 'object',
        props: {
          timestamp: { type: 'date', optional: true, default: () => new Date(), convert: true },
          exchange: { type: 'string' },
          market: { type: 'string' },
          side: { type: 'enum', values: Object.values(Order.sides) },
          type: { type: 'enum', values: Object.values(Order.types) },
          price: { type: 'number', optional: true, min: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
          stopPrice: { type: 'number', optional: true, min: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
          baseQuantity: { type: 'number', optional: true, min: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
          quoteQuantity: { type: 'number', optional: true, min: 0, convert: true, custom: value => Order.convertToBigNumber(value) }
        }
      },
      exchange: { type: 'string' },
      market: { type: 'string' },
      status: { type: 'enum', optional: true, default: Order.statuses.NEW, values: Object.values(Order.statuses) },
      side: { type: 'enum', values: Object.values(Order.sides) },
      type: { type: 'enum', values: Object.values(Order.types) },
      baseQuantityGross: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
      baseQuantityNet: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
      quoteQuantityGross: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
      quoteQuantityNet: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
      price: { type: 'number', optional: true, min: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
      stopPrice: { type: 'number', optional: true, min: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
      stopPriceHit: { type: 'boolean', optional: true, convert: true },
      averagePrice: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
      trades: { type: 'array', items: { type: 'class', instanceOf: Trade }, optional: true, default: [] }
    }
  }

  static fromExchangeOrder (exchangeOrder, overrides = {}) {
    return new Order(_.defaultsDeep(
      {},
      overrides,
      {
        foreignId: exchangeOrder.id,
        options: {
          ..._.pick(exchangeOrder, [
            'timestamp',
            'exchange',
            'market',
            'type',
            'side',
            'price',
            'stopPrice',
            'baseQuantity',
            'quoteQuantity'
          ])
        },
        ..._.pick(exchangeOrder, [
          'timestamp',
          'status',
          'exchange',
          'market',
          'side',
          'type',
          'price',
          'stopPrice',
          'baseQuantityGross',
          'baseQuantityNet',
          'quoteQuantityGross',
          'quoteQuantityNet',
          'averagePrice',
          'trades'
        ])
      }
    ))
  }

  // static validateOptionsPrice (value, errors, _schema, _field, _, context) {
  //   if (!context.data.options) {
  //     return
  //   }

  //   if (!Order.validatePrice(context.data.options.type, value)) {
  //     errors.push({ type: 'required' })
  //   }

  //   return Order.convertToBigNumber(value)
  // }

  // static validateOptionsStopPrice (value, errors, _schema, _field, _, context) {
  //   if (!context.data.options) {
  //     return
  //   }

  //   if (!Order.validateStopPrice(context.data.options.type, value)) {
  //     errors.push({ type: 'required' })
  //   }

  //   return Order.convertToBigNumber(value)
  // }

  static validatePrice (type, price) {
    type = type || ''

    if (type.includes('LIMIT') && !price) {
      return false
    }

    return true
  }

  static validateStopPrice (type, price) {
    type = type || ''

    const isStopLossOrTakeProfit = type.includes('STOP_LOSS') || type.includes('TAKE_PROFIT')

    if (isStopLossOrTakeProfit && !price) {
      return false
    }

    return true
  }

  static validateQuantities (base, quote) {
    if ((!base && !quote) || (base && quote)) {
      return false
    }

    return true
  }
}

module.exports = Order
