const Model = require('./base')

class OrderOptions extends Model {
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

  static get buyTypes () {
    return [this.types.MARKET, this.types.LIMIT]
  }

  static get schema () {
    return {
      $$root: true,
      type: 'object',
      props: {
        timestamp: { type: 'date', optional: true, default: () => new Date(), convert: true },
        exchange: { type: 'string' },
        market: { type: 'string' },
        side: { type: 'enum', values: Object.values(OrderOptions.sides) },
        type: { type: 'enum', values: Object.values(OrderOptions.types), custom: (...args) => OrderOptions.validateOrderType(...args) },
        baseQuantity: { type: 'number', optional: true, min: 0, convert: true, custom: (...args) => OrderOptions.validateOrderBaseQuantity(...args) },
        quoteQuantity: { type: 'number', optional: true, min: 0, convert: true, custom: value => OrderOptions.convertToBigNumber(value) },
        price: { type: 'number', optional: true, min: 0, convert: true, custom: (...args) => OrderOptions.validateOrderPrice(...args) },
        stopPrice: { type: 'number', optional: true, min: 0, convert: true, custom: (...args) => OrderOptions.validateOrderStopPrice(...args) }
      }
    }
  }

  static validateType (side, type) {
    const isBuyType = OrderOptions.types[type] && OrderOptions.buyTypes.includes(type)

    if (OrderOptions.sides[side] && side === OrderOptions.sides.BUY && !isBuyType) {
      return false
    }

    return true
  }

  static validateOrderType (value, errors, _schema, _field, _, context) {
    if (!OrderOptions.validateType(context.data.side, value)) {
      errors.push({ type: 'doesNotSupport', actual: OrderOptions.sides.BUY })
    }

    return value
  }

  static validateQuantities (base, quote) {
    if ((!base && !quote) || (base && quote)) {
      return false
    }

    return true
  }

  static validateOrderBaseQuantity (value, errors, _schema, _field, _, context) {
    const type = context.data.type
    const quoteQuantity = context.data.quoteQuantity

    if (OrderOptions.buyTypes.includes(type) && !OrderOptions.validateQuantities(value, quoteQuantity)) {
      errors.push({ field: 'baseQuantity', type: 'orRequired', expected: 'quoteQuantity' })
    } else if (!OrderOptions.buyTypes.includes(type) && !value) {
      errors.push({ field: 'baseQuantity', type: 'required' })
    }

    return OrderOptions.convertToBigNumber(value)
  }

  static validatePrice (type, price) {
    type = type || ''

    if (type.includes('LIMIT') && !price) {
      return false
    }

    return true
  }

  static validateOrderPrice (value, errors, _schema, _field, _, context) {
    if (!OrderOptions.validatePrice(context.data.type, value)) {
      errors.push({ type: 'required' })
    }

    return OrderOptions.convertToBigNumber(value)
  }

  static validateStopPrice (type, price) {
    type = type || ''

    const isStopLossOrTakeProfit = type.includes('STOP_LOSS') || type.includes('TAKE_PROFIT')

    if (isStopLossOrTakeProfit && !price) {
      return false
    }

    return true
  }

  static validateOrderStopPrice (value, errors, _schema, _field, _, context) {
    if (!OrderOptions.validateStopPrice(context.data.type, value)) {
      errors.push({ type: 'required' })
    }

    return OrderOptions.convertToBigNumber(value)
  }
}

module.exports = OrderOptions
