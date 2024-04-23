const _ = require('lodash')
const { v4: uuid } = require('uuid')

const Model = require('./base')
const OrderOptions = require('./orderOptions')
const Trade = require('./trade')

class Order extends Model {
  static get statuses () {
    return { NEW: 'NEW', OPEN: 'OPEN', FILLED: 'FILLED', CANCELLED: 'CANCELLED' }
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
          side: { type: 'enum', values: Object.values(OrderOptions.sides) },
          type: { type: 'enum', values: Object.values(OrderOptions.types), custom: (...args) => Order.validateOptionsType(...args) },
          baseQuantity: { type: 'number', optional: true, min: 0, convert: true, custom: (...args) => Order.validateOptionsBaseQuantity(...args) },
          quoteQuantity: { type: 'number', optional: true, min: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
          price: { type: 'number', optional: true, min: 0, convert: true, custom: (...args) => Order.validateOptionsPrice(...args) },
          stopPrice: { type: 'number', optional: true, min: 0, convert: true, custom: (...args) => Order.validateOptionsStopPrice(...args) }
        }
      },
      exchange: { type: 'string' },
      market: { type: 'string' },
      status: { type: 'enum', optional: true, default: Order.statuses.NEW, values: Object.values(Order.statuses) },
      side: { type: 'enum', values: Object.values(OrderOptions.sides) },
      type: { type: 'enum', values: Object.values(OrderOptions.types), custom: (...args) => Order.validateOrderType(...args) },
      baseQuantityGross: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
      baseQuantityNet: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
      quoteQuantityGross: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
      quoteQuantityNet: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
      price: { type: 'number', optional: true, min: 0, convert: true, custom: (...args) => Order.validateOrderPrice(...args) },
      stopPrice: { type: 'number', optional: true, min: 0, convert: true, custom: (...args) => Order.validateOrderStopPrice(...args) },
      stopPriceHit: { type: 'boolean', optional: true, convert: true },
      averagePrice: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => Order.convertToBigNumber(value) },
      trades: { type: 'array', items: { type: 'class', instanceOf: Trade }, optional: true, default: [] },
      closedAt: { type: 'date', optional: true, convert: true, custom: (...args) => Order.setClosedAt(...args) }
    }
  }

  static fromExchangeOrder (exchangeOrder, overrides = {}) {
    const params = _.defaultsDeep(
      {},
      overrides,
      {
        foreignId: exchangeOrder.id,
        options: _.pick(exchangeOrder, [
          'timestamp',
          'exchange',
          'market',
          'type',
          'side',
          'price',
          'stopPrice'
        ]),
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
          'trades',
          'closedAt'
        ])
      }
    )

    return new Order(params)
  }

  static validateOrderType (value, errors, _schema, _field, _, context) {
    if (!OrderOptions.validateType(context.data.side, value)) {
      errors.push({ type: 'doesNotSupport', actual: OrderOptions.sides.BUY })
    }

    return value
  }

  static validateOptionsType (value, errors, _schema, _field, _, context) {
    if (!OrderOptions.validateType(context.data?.options?.side, value)) {
      errors.push({ field: 'options.type', type: 'doesNotSupport', actual: OrderOptions.sides.BUY })
    }

    return value
  }

  static validateOptionsBaseQuantity (value, errors, _schema, _field, _, context) {
    const type = context.data.options?.type
    const quoteQuantity = context.data.options?.quoteQuantity

    if (OrderOptions.buyTypes.includes(type) && !OrderOptions.validateQuantities(value, quoteQuantity)) {
      errors.push({ field: 'options.baseQuantity', type: 'orRequired', expected: 'options.quoteQuantity' })
    } else if (!OrderOptions.buyTypes.includes(type) && !value) {
      errors.push({ field: 'options.baseQuantity', type: 'required' })
    }

    return Order.convertToBigNumber(value)
  }

  static validateOrderPrice (value, errors, _schema, _field, _, context) {
    if (!OrderOptions.validatePrice(context.data.type, value)) {
      errors.push({ type: 'required' })
    }

    return Order.convertToBigNumber(value)
  }

  static validateOptionsPrice (value, errors, _schema, _field, _, context) {
    if (!OrderOptions.validatePrice(context.data.options?.type, value)) {
      errors.push({ type: 'required' })
    }

    return Order.convertToBigNumber(value)
  }

  static validateOrderStopPrice (value, errors, _schema, _field, _, context) {
    if (!OrderOptions.validateStopPrice(context.data.type, value)) {
      errors.push({ type: 'required' })
    }

    return Order.convertToBigNumber(value)
  }

  static validateOptionsStopPrice (value, errors, _schema, _field, _, context) {
    if (!OrderOptions.validateStopPrice(context.data.options?.type, value)) {
      errors.push({ type: 'required' })
    }

    return Order.convertToBigNumber(value)
  }

  static setClosedAt (value, errors, _schema, _field, _modalinput, context) {
    const closedStatuses = [
      Order.statuses.FILLED,
      Order.statuses.CANCELLED
    ]

    if (!value && closedStatuses.includes(context.data.status)) {
      errors.push({ type: 'required' })
    }

    return value
  }
}

module.exports = Order
