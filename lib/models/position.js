const _ = require('lodash')

const moment = require('moment')
const { v4: uuid } = require('uuid')

const Model = require('./base')
const Order = require('./order')

class Position extends Model {
  static get types () {
    return { LONG: 'LONG' }
  }

  static get statuses () {
    return { NEW: 'NEW', OPEN: 'OPEN', CLOSING: 'CLOSING', CLOSED: 'CLOSED' }
  }

  static get schema () {
    return {
      id: { type: 'uuid', default: () => uuid() },
      signalId: { type: 'uuid', optional: true },
      timestamp: { type: 'date', optional: true, default: () => new Date(), convert: true },
      exchange: { type: 'string' },
      market: { type: 'string' },
      status: { type: 'enum', optional: true, default: Position.statuses.NEW, values: Object.values(Position.statuses) },
      type: { type: 'enum', values: Object.values(Position.types) },
      entry: {
        type: 'object',
        props: {
          exchange: { type: 'string' },
          market: { type: 'string' },
          type: { type: 'enum', values: Object.values(Order.types) },
          price: { type: 'number', optional: true, min: 0, convert: true, custom: value => Position.convertToBigNumber(value) },
          baseQuantity: { type: 'number', optional: true, min: 0, convert: true, custom: value => Position.convertToBigNumber(value) },
          quoteQuantity: { type: 'number', optional: true, min: 0, convert: true, custom: value => Position.convertToBigNumber(value) }
        },
        custom: (...args) => {
          Position.validatePrice(...args)
          Position.validateQuantities(...args)

          return args[0]
        }
      },
      exit: {
        type: 'array',
        optional: true,
        convert: true,
        default: [],
        items: {
          type: 'object',
          props: {
            id: { type: 'uuid', default: () => uuid() },
            exchange: { type: 'string' },
            market: { type: 'string' },
            type: { type: 'enum', values: Object.values(Order.types) },
            stopPrice: { type: 'string', optional: true },
            price: { type: 'string', optional: true, convert: true },
            baseQuantity: { type: 'string', optional: true, convert: true },
            quoteQuantity: { type: 'string', optional: true, convert: true }
          },
          custom: (...args) => {
            Position.validatePrice(...args)
            Position.validateQuantities(...args)

            return args[0]
          }
        }
      },
      win: { type: 'boolean', optional: true, default: () => null },
      realizedPnL: { type: 'number', optional: true, default: 0, convert: true, custom: value => Position.convertToBigNumber(value) },
      realizedPnLPercent: { type: 'number', optional: true, default: 0, convert: true, custom: value => Position.convertToBigNumber(value) },
      unrealizedPnL: { type: 'number', optional: true, default: 0, convert: true, custom: value => Position.convertToBigNumber(value) },
      unrealizedPnLPercent: { type: 'number', optional: true, default: 0, convert: true, custom: value => Position.convertToBigNumber(value) },
      pnl: { type: 'number', optional: true, default: 0, convert: true, custom: value => Position.convertToBigNumber(value) },
      pnlPercent: { type: 'number', optional: true, default: 0, convert: true, custom: value => Position.convertToBigNumber(value) },
      orders: { type: 'array', optional: true, items: { type: 'class', instanceOf: Order }, default: [] },
      statistics: {
        type: 'object',
        default: {},
        props: {
          duration: { type: 'number', optional: true, convert: true }
        },
        custom: (...args) => Position.setStatistics(...args)
      },
      createdAt: { type: 'date', optional: true, default: () => new Date(), convert: true },
      closedAt: { type: 'date', optional: true, convert: true, custom: (...args) => Position.setClosedAt(...args) }
    }
  }

  findFilledEntryOrders () {
    return this.orders.filter(order => {
      const side = this.type === 'LONG' ? 'BUY' : 'SELL'

      return order.side === side && order.status === 'FILLED'
    })
  }

  findFilledExitOrders () {
    return this.orders.filter(order => {
      const side = this.type === 'LONG' ? 'SELL' : 'BUY'

      return order.side === side && order.status === 'FILLED'
    })
  }

  static validatePrice (entryOrExit, errors, _schema, field, input) {
    if (!entryOrExit) {
      return
    }

    const canValidate = _.castArray(entryOrExit).every(item => _.isObject(item))

    if (canValidate && !Order.validatePrice(entryOrExit.type, entryOrExit.price)) {
      const index = field === 'exit[]' ? input.exit.findIndex((e) => e === entryOrExit) : false
      const normalizedField = index !== false ? `${field.replace('[]', '')}[${index}].price` : `${field}.price`

      errors.push({ field: normalizedField, type: 'required' })
    }

    return entryOrExit
  }

  static validateQuantities (entryOrExit, errors, _schema, field, input) {
    if (!entryOrExit) {
      return
    }

    const canValidate = _.castArray(entryOrExit).every(item => _.isObject(item))

    if (canValidate && !Order.validateQuantities(entryOrExit.baseQuantity, entryOrExit.quoteQuantity)) {
      const index = field === 'exit[]' ? input.exit.findIndex((e) => e === entryOrExit) : false
      const normalizedField = index !== false ? `${field.replace('[]', '')}[${index}]` : `${field}`

      errors.push({ field: `${normalizedField}.baseQuantity`, type: 'orRequired', expected: `${normalizedField}.quoteQuantity` })
    }

    return entryOrExit
  }

  static setStatistics (value, _errors, _schema, _field, _input, context) {
    const statistics = _.cloneDeep(value)

    if (!value.statistics && context.data.timestamp && context.data.closedAt) {
      const duration = moment.duration(moment(context.data.closedAt).diff(context.data.timestamp))

      statistics.duration = duration.asMilliseconds()
    }

    return statistics
  }

  static setClosedAt (value, _errors, _schema, _field, _input, context) {
    if (!value && context.data.status === Position.statuses.CLOSED) {
      return new Date()
    }

    return value
  }
}

module.exports = Position
