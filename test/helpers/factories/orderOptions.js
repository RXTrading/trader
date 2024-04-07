const _ = require('lodash')

const { OrderOptions } = require('../../../lib/models')

module.exports = Factory => {
  Factory.define('orderOptions', function (overrides, chance) {
    return new OrderOptions(_.defaultsDeep({}, overrides, {
      exchange: 'binance',
      market: 'BTC/USDT',
      side: OrderOptions.sides.BUY,
      type: OrderOptions.types.LIMIT,
      price: chance.integer({ min: 1, max: 10 }),
      quoteQuantity: chance.integer({ min: 100, max: 1000 })
    }))
  })
}
