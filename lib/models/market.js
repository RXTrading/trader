const Model = require('./base')

class Market extends Model {
  static get schema () {
    return {
      symbol: { type: 'string' },
      base: { type: 'string' },
      quote: { type: 'string' },
      fees: {
        type: 'object',
        default: { maker: Market.convertToBigNumber(0.001), taker: Market.convertToBigNumber(0.001) },
        props: {
          maker: { type: 'number', min: 0, default: 0.001, convert: true, custom: value => Market.convertToBigNumber(value) },
          taker: { type: 'number', min: 0, default: 0.001, convert: true, custom: value => Market.convertToBigNumber(value) }
        }
      },
      precision: {
        type: 'object',
        default: { base: 8, price: 2, quote: 8, amount: 5 },
        props: {
          base: { type: 'number', min: 0, default: 8, convert: true },
          price: { type: 'number', min: 0, default: 2, convert: true },
          quote: { type: 'number', min: 0, default: 8, convert: true },
          amount: { type: 'number', min: 0, default: 5, convert: true }
        }
      },
      limits: {
        type: 'object',
        default: {
          amount: {
            min: Market.convertToBigNumber(0.00001),
            max: Market.convertToBigNumber(100000.00)
          },
          cost: {
            min: Market.convertToBigNumber(10),
            max: Market.convertToBigNumber(100000.00)
          }
        },
        props: {
          amount: {
            type: 'object',
            default: {
              min: Market.convertToBigNumber(0.00001),
              max: Market.convertToBigNumber(100000.00)
            },
            props: {
              min: { type: 'number', min: 0, default: 0.000001, convert: true, custom: value => Market.convertToBigNumber(value) },
              max: { type: 'number', min: 0, default: 100000.00, convert: true, custom: value => Market.convertToBigNumber(value) }
            }
          },
          cost: {
            type: 'object',
            default: {
              min: Market.convertToBigNumber(10),
              max: Market.convertToBigNumber(100000.00)
            },
            props: {
              min: { type: 'number', min: 0, default: 10.00, convert: true, custom: value => Market.convertToBigNumber(value) },
              max: { type: 'number', min: 0, default: 100000.00, convert: true, custom: value => Market.convertToBigNumber(value) }
            }
          }
        }
      }
    }
  }
}

module.exports = Market
