const { v4: uuid } = require('uuid')

const Model = require('./base')

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
      params: { type: 'object', optional: true, default: {} },
      rule: { type: 'object', optional: true, default: {} }
    }
  }
}

module.exports = Signal
