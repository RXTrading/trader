const Model = require('./base')

class Log extends Model {
  static get schema () {
    return {
      timestamp: { type: 'date', optional: true, default: () => new Date(), convert: true },
      type: { type: 'enum', values: ['info', 'success', 'warning', 'error'] },
      code: { type: 'string' },
      data: { type: 'object', optional: true, default: {} }
    }
  }
}

module.exports = Log
