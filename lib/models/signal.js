const _ = require('lodash')
const { v4: uuid, validate: validateUUID } = require('uuid')

const Model = require('./base')
const Position = require('./position')
const OrderOptions = require('./orderOptions')

class Signal extends Model {
  static get statuses () {
    return { NEW: 'NEW', PROCESSING: 'PROCESSING', ACCEPTED: 'ACCEPTED', REJECTED: 'REJECTED', EXPIRED: 'EXPIRED' }
  }

  static get types () {
    return { OPEN_POSITION: 'OPEN_POSITION', CLOSE_POSITION: 'CLOSE_POSITION', CLOSE_ALL_POSITIONS: 'CLOSE_ALL_POSITIONS' }
  }

  static get schema () {
    return {
      id: { type: 'uuid', optional: true, default: () => uuid() },
      timestamp: { type: 'date', optional: true, default: () => new Date(), convert: true },
      type: { type: 'enum', values: Object.values(Signal.types) },
      status: { type: 'enum', optional: true, default: Signal.statuses.NEW, values: Object.values(Signal.statuses) },
      params: { type: 'object', optional: true, default: {}, custom: (...args) => Signal.validateParams(...args) },
      rule: { type: 'object', optional: true, default: {} }
    }
  }

  static validateParams (params, errors, _schema, _field, _modal, context) {
    if (context.data.type === Signal.types.OPEN_POSITION) {
      Signal.validateOpenPositionParams(params, errors)
    } else if (context.data.type === Signal.types.CLOSE_POSITION) {
      Signal.validateClosePositionParams(params, errors)
    }

    return params
  }

  static validateOpenPositionParams (params, errors) {
    this.#validatePositionType(params, errors)
    this.#validatePositionEntries(params, errors)
    this.#validatePositionExits(params, errors)
  }

  static validateClosePositionParams (params, errors) {
    if (!params.id) {
      errors.push({ field: 'params.id', type: 'required', actual: params.id })
    } else if (!validateUUID(params.id)) {
      errors.push({ field: 'params.id', type: 'uuid', actual: params.id })
    }
  }

  static #validatePositionType (params, errors) {
    if (!params.type) {
      errors.push({ field: 'params.type', type: 'required', actual: params.type })
    } else if (!Object.values(Position.types).includes(params.type)) {
      errors.push({ field: 'params.type', type: 'enumValue', expected: Object.values(Position.types).join(', '), actual: params.type })
    }
  }

  static #validatePositionEntries (params, errors) {
    if (params.entries) {
      const entries = _.castArray(params.entries)

      for (let i = 0; i < entries.length; i++) {
        if (!entries[i].exchange) {
          errors.push({ field: `params.entries[${i}].exchange`, type: 'required', actual: entries[i].exchange })
        }

        if (!entries[i].market) {
          errors.push({ field: `params.entries[${i}].market`, type: 'required', actual: entries[i].market })
        }

        this.#validateEntryType(i, entries[i], errors)
        this.#validateEntryBaseQuantity(i, entries[i], errors)

        if (!OrderOptions.validatePrice(entries[i].type, entries[i].price)) {
          errors.push({ field: `params.entries[${i}].price`, type: 'required', actual: entries[i].price })
        }

        if (!OrderOptions.validateStopPrice(entries[i].type, entries[i].stopPrice)) {
          errors.push({ field: `params.entries[${i}].stopPrice`, type: 'required', actual: entries[i].stopPrice })
        }
      }
    } else {
      errors.push({ field: 'params.entries', type: 'required', actual: params.entries })
    }
  }

  static #validatePositionExits (params, errors) {
    if (params.exits) {
      const exits = _.castArray(params.exits)

      for (let i = 0; i < exits.length; i++) {
        if (!exits[i].exchange) {
          errors.push({ field: `params.exits[${i}].exchange`, type: 'required', actual: exits[i].exchange })
        }

        if (!exits[i].market) {
          errors.push({ field: `params.exits[${i}].market`, type: 'required', actual: exits[i].market })
        }

        this.#validateExitType(i, exits[i], errors)
        this.#validateExitBaseQuantity(i, exits[i], errors)

        if (!OrderOptions.validatePrice(exits[i].type, exits[i].price)) {
          errors.push({ field: `params.exits[${i}].price`, type: 'required', actual: exits[i].price })
        }

        if (!OrderOptions.validateStopPrice(exits[i].type, exits[i].stopPrice)) {
          errors.push({ field: `params.exits[${i}].stopPrice`, type: 'required', actual: exits[i].stopPrice })
        }
      }
    }
  }

  static #validateEntryType (index, entry, errors) {
    const side = entry.side ? entry.side : OrderOptions.buyTypes.includes(entry.type) ? OrderOptions.sides.BUY : OrderOptions.sides.SELL

    if (!entry.type) {
      errors.push({ field: `params.entries[${index}].type`, type: 'required', actual: entry.type })
    } else if (!Object.values(OrderOptions.types).includes(entry.type)) {
      errors.push({ field: `params.entries[${index}].type`, type: 'enumValue', expected: Object.values(OrderOptions.types).join(', '), actual: entry.type })
    } else if (!OrderOptions.validateType(side, entry.type)) {
      errors.push({ field: `params.entries[${index}].type`, type: 'doesNotSupport', actual: side })
    }
  }

  static #validateExitType (index, exit, errors) {
    const side = exit.side ? exit.side : OrderOptions.buyTypes.includes(exit.type) ? OrderOptions.sides.BUY : OrderOptions.sides.SELL

    if (!exit.type) {
      errors.push({ field: `params.exits[${index}].type`, type: 'required', actual: exit.type })
    } else if (!Object.values(OrderOptions.types).includes(exit.type)) {
      errors.push({ field: `params.exits[${index}].type`, type: 'enumValue', expected: Object.values(OrderOptions.types).join(', '), actual: exit.type })
    } else if (!OrderOptions.validateType(side, exit.type)) {
      errors.push({ field: `params.exits[${index}].type`, type: 'doesNotSupport', actual: side })
    }
  }

  static #validateEntryBaseQuantity (index, entry, errors) {
    if (OrderOptions.buyTypes.includes(entry.type) && !OrderOptions.validateQuantities(entry.baseQuantity, entry.quoteQuantity)) {
      errors.push({ field: `params.entries[${index}].baseQuantity`, type: 'orRequired', expected: `params.entries[${index}].quoteQuantity` })
    } else if (!OrderOptions.buyTypes.includes(entry.type) && !entry.baseQuantity) {
      errors.push({ field: `params.entries[${index}].baseQuantity`, type: 'required' })
    }
  }

  static #validateExitBaseQuantity (index, exit, errors) {
    if (OrderOptions.buyTypes.includes(exit.type) && !OrderOptions.validateQuantities(exit.baseQuantity, exit.quoteQuantity)) {
      errors.push({ field: `params.exits[${index}].baseQuantity`, type: 'orRequired', expected: `params.exits[${index}].quoteQuantity` })
    } else if (!OrderOptions.buyTypes.includes(exit.type) && !exit.baseQuantity) {
      errors.push({ field: `params.exits[${index}].baseQuantity`, type: 'required' })
    }
  }
}

module.exports = Signal
