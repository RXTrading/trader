const _ = require('lodash')

const moment = require('moment')
const { v4: uuid } = require('uuid')

const Model = require('./base')
const Order = require('./order')
const OrderOptions = require('./orderOptions')

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
      entries: {
        type: 'array',
        convert: true,
        default: [],
        items: {
          type: 'object',
          default: {},
          props: {
            exchange: { type: 'string' },
            market: { type: 'string' },
            type: { type: 'enum', values: Object.values(OrderOptions.types) },
            baseQuantity: { type: 'number', optional: true, min: 0, convert: true },
            quoteQuantity: { type: 'number', optional: true, min: 0, convert: true },
            price: { type: 'number', optional: true, min: 0, convert: true }
          },
          custom: (...args) => {
            Position.validateEntryType(...args)
            Position.validateEntryBaseQuantity(...args)
            Position.validateEntryPrice(...args)

            return args[0]
          }
        }
      },
      exits: {
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
            type: { type: 'enum', values: Object.values(OrderOptions.types) },
            baseQuantity: { type: 'string', optional: true, min: 0, convert: true },
            quoteQuantity: { type: 'string', optional: true, min: 0, convert: true },
            price: { type: 'string', optional: true, convert: true },
            stopPrice: { type: 'string', optional: true, min: 0, convert: true }
          },
          custom: (...args) => {
            Position.validateExitType(...args)
            Position.validateExitBaseQuantity(...args)
            Position.validateExitPrice(...args)
            Position.validateExitStopPrice(...args)

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
      metrics: {
        type: 'object',
        default: {},
        props: {
          duration: { type: 'number', optional: true, convert: true }
        },
        custom: (...args) => Position.setMetrics(...args)
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

  static validateEntryType (entry, errors, _schema, _field, _modal, context) {
    const index = _.castArray(context.data.entries).findIndex((e) => e === entry)
    const side = entry.side

    if (!OrderOptions.validateType(side, entry.type)) {
      errors.push({ field: `entries[${index}].type`, type: 'doesNotSupport', actual: OrderOptions.sides.BUY })
    }
  }

  static validateExitType (exit, errors, _schema, _field, _modal, context) {
    const index = _.castArray(context.data.exits).findIndex((e) => e === exit)
    const side = exit.side

    if (!OrderOptions.validateType(side, exit.type)) {
      errors.push({ field: `exits[${index}].type`, type: 'doesNotSupport', actual: OrderOptions.sides.BUY })
    }
  }

  static validateEntryBaseQuantity (entry, errors, _schema, _field, _modal, context) {
    const index = _.castArray(context.data.entries).findIndex((e) => e === entry)

    if (OrderOptions.buyTypes.includes(entry.type) && !OrderOptions.validateQuantities(entry.baseQuantity, entry.quoteQuantity)) {
      errors.push({ field: `entries[${index}].baseQuantity`, type: 'orRequired', expected: `entries[${index}].quoteQuantity` })
    } else if (!OrderOptions.buyTypes.includes(entry.type) && !entry.baseQuantity) {
      errors.push({ field: `entries[${index}].baseQuantity`, type: 'required' })
    }
  }

  static validateExitBaseQuantity (exit, errors, _schema, _field, _modal, context) {
    const index = _.castArray(context.data.exits).findIndex((e) => e === exit)

    if (OrderOptions.buyTypes.includes(exit.type) && !OrderOptions.validateQuantities(exit.baseQuantity, exit.quoteQuantity)) {
      errors.push({ field: `exits[${index}].baseQuantity`, type: 'orRequired', expected: `exits[${index}].quoteQuantity` })
    } else if (!OrderOptions.buyTypes.includes(exit.type) && !exit.baseQuantity) {
      errors.push({ field: `exits[${index}].baseQuantity`, type: 'required' })
    }
  }

  static validateEntryPrice (entry, errors, _schema, _field, _modal, context) {
    const index = _.castArray(context.data.entries).findIndex((e) => e === entry)

    if (!OrderOptions.validatePrice(entry.type, entry.price)) {
      errors.push({ field: `entries[${index}].price`, type: 'required' })
    }
  }

  static validateExitPrice (exit, errors, _schema, _field, _modal, context) {
    const index = _.castArray(context.data.exits).findIndex((e) => e === exit)

    if (!OrderOptions.validatePrice(exit.type, exit.price)) {
      errors.push({ field: `exits[${index}].price`, type: 'required' })
    }
  }

  static validateExitStopPrice (exit, errors, _schema, _field, _modal, context) {
    const index = _.castArray(context.data.exits).findIndex((e) => e === exit)

    if (!OrderOptions.validateStopPrice(exit.type, exit.stopPrice)) {
      errors.push({ field: `exits[${index}].stopPrice`, type: 'required' })
    }
  }

  static setMetrics (value, _errors, _schema, _field, _modalinput, context) {
    const metrics = _.cloneDeep(value)

    if (!value.metrics && context.data.timestamp && context.data.closedAt) {
      let closedAt = new Date(context.data.closedAt)

      if (isNaN(closedAt.getTime())) {
        closedAt = new Date()
      }

      const duration = moment.duration(moment(closedAt).diff(context.data.timestamp))

      metrics.duration = duration.asMilliseconds()
    }

    return metrics
  }

  static setClosedAt (value, _errors, _schema, _field, _modalinput, context) {
    if (!value && context.data.status === Position.statuses.CLOSED) {
      return new Date()
    }

    return value
  }
}

module.exports = Position
