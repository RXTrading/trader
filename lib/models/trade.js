const { v4: uuid } = require('uuid')

const Model = require('./base')

class Trade extends Model {
  static get schema () {
    return {
      id: { type: 'uuid', default: () => uuid() },
      foreignId: { type: 'uuid' },
      baseQuantityGross: { type: 'number', min: 0, convert: true, custom: value => Trade.convertToBigNumber(value) },
      baseQuantityNet: { type: 'number', min: 0, convert: true, custom: value => Trade.convertToBigNumber(value) },
      quoteQuantityGross: { type: 'number', min: 0, convert: true, custom: value => Trade.convertToBigNumber(value) },
      quoteQuantityNet: { type: 'number', min: 0, convert: true, custom: value => Trade.convertToBigNumber(value) },
      price: { type: 'number', min: 0, convert: true, custom: value => Trade.convertToBigNumber(value) },
      fee: {
        type: 'object',
        props: {
          currency: { type: 'string' },
          cost: { type: 'number', min: 0, convert: true, custom: value => Trade.convertToBigNumber(value) }
        }
      }
    }
  }
}

module.exports = Trade
