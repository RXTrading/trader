const _ = require('lodash')

const { Position, Order } = require('../../../lib/models')

module.exports = Factory => {
  Factory.define('position', function (overrides, chance) {
    return new Position(_.defaultsDeep({}, overrides, {
      exchange: 'binance',
      market: 'BTC/USDT',
      status: Position.statuses.OPEN,
      type: Position.types.LONG,
      entry: {
        exchange: 'binance',
        market: 'BTC/USDT',
        type: Order.types.LIMIT,
        price: chance.integer({ min: 1, max: 10 }),
        quoteQuantity: chance.integer({ min: 100, max: 1000 })
      },
      exit: [],
      orders: []
    }))
  })
}
