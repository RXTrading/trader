const Model = require('./base')
const Order = require('./order')
const OrderOptions = require('./orderOptions')
const Trade = require('./trade')

class ExchangeOrder extends Model {
  static get statuses () {
    return Order.statuses
  }

  static get schema () {
    return {
      id: { type: 'uuid' },
      timestamp: { type: 'date', optional: true, default: () => new Date(), convert: true },
      exchange: { type: 'string' },
      market: { type: 'string' },
      status: { type: 'enum', optional: true, default: Order.statuses.NEW, values: Object.values(ExchangeOrder.statuses) },
      side: { type: 'enum', values: Object.values(OrderOptions.sides) },
      type: { type: 'enum', values: Object.values(OrderOptions.types), custom: (...args) => ExchangeOrder.validateType(...args) },
      baseQuantity: { type: 'number', optional: true, min: 0, convert: true, custom: value => ExchangeOrder.convertToBigNumber(value) },
      quoteQuantity: { type: 'number', optional: true, min: 0, convert: true, custom: value => ExchangeOrder.convertToBigNumber(value) },
      price: { type: 'number', optional: true, min: 0, convert: true, custom: (...args) => ExchangeOrder.validatePrice(...args) },
      stopPrice: { type: 'number', optional: true, min: 0, convert: true, custom: (...args) => ExchangeOrder.validateStopPrice(...args) },
      stopPriceHit: { type: 'boolean', optional: true, convert: true },
      baseQuantityGross: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => ExchangeOrder.convertToBigNumber(value) },
      baseQuantityNet: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => ExchangeOrder.convertToBigNumber(value) },
      quoteQuantityGross: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => ExchangeOrder.convertToBigNumber(value) },
      quoteQuantityNet: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => ExchangeOrder.convertToBigNumber(value) },
      averagePrice: { type: 'number', optional: true, min: 0, default: 0, convert: true, custom: value => ExchangeOrder.convertToBigNumber(value) },
      trades: { type: 'array', items: { type: 'class', instanceOf: Trade }, optional: true, default: [] }
    }
  }

  static isMarketOrder (order = {}) {
    if (OrderOptions.marketTypes.includes(order.type)) {
      return true
    }

    return false
  }

  static isLimitOrder (order = {}) {
    if (OrderOptions.limitTypes.includes(order.type)) {
      return true
    }

    return false
  }

  static validateType (value, errors, _schema, _field, _, context) {
    if (!OrderOptions.validateType(context.data.side, value)) {
      errors.push({ type: 'doesNotSupport', actual: OrderOptions.sides.BUY })
    }

    return value
  }

  static validatePrice (value, errors, _schema, _field, _, context) {
    if (!OrderOptions.validatePrice(context.data.type, value)) {
      errors.push({ type: 'required' })
    }

    return Order.convertToBigNumber(value)
  }

  static validateStopPrice (value, errors, _schema, _field, _, context) {
    if (!OrderOptions.validateStopPrice(context.data.type, value)) {
      errors.push({ type: 'required' })
    }

    return Order.convertToBigNumber(value)
  }
}

module.exports = ExchangeOrder
