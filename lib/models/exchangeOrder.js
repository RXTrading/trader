const Model = require('./base')
const Order = require('./order')
const Trade = require('./trade')

class ExchangeOrder extends Model {
  static get statuses () {
    return Order.statuses
  }

  static get sides () {
    return Order.sides
  }

  static get types () {
    return Order.types
  }

  static get marketTypes () {
    return Order.marketTypes
  }

  static get limitTypes () {
    return Order.limitTypes
  }

  static get buyAndSellTypes () {
    return [Order.types.MARKET, Order.types.LIMIT]
  }

  static get schema () {
    return {
      id: { type: 'uuid' },
      timestamp: { type: 'date', optional: true, default: () => new Date(), convert: true },
      exchange: { type: 'string' },
      market: { type: 'string' },
      status: { type: 'enum', optional: true, default: Order.statuses.NEW, values: Object.values(ExchangeOrder.statuses) },
      side: { type: 'enum', values: Object.values(ExchangeOrder.sides) },
      type: { type: 'enum', values: Object.values(ExchangeOrder.types), custom: (...args) => ExchangeOrder.validateType(...args) },
      baseQuantity: { type: 'number', optional: true, min: 0, convert: true, custom: (...args) => ExchangeOrder.validateQuantities(...args) },
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
    if (ExchangeOrder.marketTypes.includes(order.type)) {
      return true
    }

    return false
  }

  static isLimitOrder (order = {}) {
    if (ExchangeOrder.limitTypes.includes(order.type)) {
      return true
    }

    return false
  }

  static validatePrice (value, errors, _schema, _field, _, context) {
    if (!Order.validatePrice(context.data.type, value)) {
      errors.push({ type: 'required' })
    }

    return Order.convertToBigNumber(value)
  }

  static validateStopPrice (value, errors, _schema, _field, _, context) {
    if (!Order.validateStopPrice(context.data.type, value)) {
      errors.push({ type: 'required' })
    }

    return Order.convertToBigNumber(value)
  }

  // Only support certain sides when using specific order types.
  // - MARKET orders can be BUY or SELL
  // - LIMIT orders can be BUY or SELL
  // - ALL other order types can only be SELL.
  static validateType (value, errors, _schema, _field, _, context) {
    if (!ExchangeOrder.types[value]) {
      return
    }

    if (!this.buyAndSellTypes.includes(value) && context.data.side === Order.sides.BUY) {
      errors.push({ field: 'type', type: 'supportsOnly', expected: Order.sides.SELL })
    }

    return value
  }

  // Depending on the order type and side, different quantities are required.
  // - MARKET and LIMIT orders must supply quote quantity when side is BUY and base quantity when side is SELL
  // - All other order types must supply the base quantity as only SELL is accepted
  static validateQuantities (value, errors, _schema, _field, _, context) {
    if (this.buyAndSellTypes.includes(context.data.type)) {
      if (context.data.side === Order.sides.BUY && !context.data.quoteQuantity) {
        errors.push({ field: 'quoteQuantity', type: 'required' })
      } else if (context.data.side === Order.sides.SELL && !context.data.baseQuantity) {
        errors.push({ field: 'baseQuantity', type: 'required' })
      }
    } else if (!context.data.baseQuantity) {
      errors.push({ field: 'baseQuantity', type: 'required' })
    }

    return Order.convertToBigNumber(value)
  }

  // static validateQuantities (value, errors, _schema, _field, _, context) {
  //   const buyAndSellTypes = [Order.types.MARKET, Order.types.LIMIT]

  //   if (context.data.type === Order.types.MARKET) {
  //     if (!Order.validateQuantities(value, context.data.quoteQuantity)) {
  //       errors.push({ type: 'orRequired', expected: 'quoteQuantity' })
  //     } else if (context.data.side === Order.sides.BUY && !context.data.quoteQuantity) {
  //       errors.push({ field: 'quoteQuantity', type: 'required' })
  //     } else if (context.data.side === Order.sides.SELL && !context.data.baseQuantity) {
  //       errors.push({ field: 'baseQuantity', type: 'required' })
  //     }
  //   } else if (context.data.type === Order.types.LIMIT) {
  //     if (!context.data.baseQuantity) {
  //       errors.push({ field: 'baseQuantity', type: 'required' })
  //     }

  //     if (!context.data.quoteQuantity) {
  //       errors.push({ field: 'quoteQuantity', type: 'required' })
  //     }
  //   } else if (!context.data.baseQuantity) {
  //     errors.push({ field: 'baseQuantity', type: 'required' })
  //   }

  //   return Order.convertToBigNumber(value)
  // }
}

module.exports = ExchangeOrder
