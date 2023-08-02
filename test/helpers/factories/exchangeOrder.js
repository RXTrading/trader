const _ = require('lodash')

const { ExchangeOrder } = require('../../../lib/models')

module.exports = Factory => {
  Factory.define('exchangeOrder', function (overrides, chance) {
    const params = _.defaultsDeep({}, overrides, {
      id: chance.guid({ version: 4 }),
      status: ExchangeOrder.statuses.OPEN,
      exchange: 'binance',
      market: 'BTC/USDT',
      side: ExchangeOrder.sides.BUY,
      type: ExchangeOrder.types.MARKET
    })

    if (params.side === ExchangeOrder.sides.BUY && !params.quoteQuantity) {
      params.quoteQuantity = chance.floating({ min: 10, max: 100 })
    }

    if (params.side === ExchangeOrder.sides.SELL && !params.baseQuantity) {
      params.baseQuantity = chance.floating({ min: 10, max: 100 })
    }

    return new ExchangeOrder(params)
  })
}
