const Model = require('./base')

class Balance extends Model {
  static get schema () {
    return {
      symbol: { type: 'string' },
      free: { type: 'number', min: 0, default: 0, convert: true, custom: value => Balance.convertToBigNumber(value) },
      used: { type: 'number', min: 0, default: 0, convert: true, custom: value => Balance.convertToBigNumber(value) },
      total: { type: 'number', min: 0, default: 0, convert: true, custom: value => Balance.convertToBigNumber(value) }
    }
  }
}

module.exports = Balance
