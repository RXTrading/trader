const _ = require('lodash')

const { Order } = require('../../../lib/models')

module.exports = Factory => {
  Factory.define('orderFromExchangeOrder', function (exchangeOrder) {
    return new Order({
      foreignId: exchangeOrder.id,
      options: { ..._.pick(exchangeOrder, ['exchange', 'market', 'side', 'type', 'price', 'baseQuantity', 'quoteQuantity']) },
      ..._.pick(exchangeOrder, [
        'status',
        'exchange',
        'market',
        'side',
        'type',
        'price',
        'averagePrice',
        'baseQuantityGross',
        'baseQuantityNet',
        'quoteQuantityGross',
        'quoteQuantityNet',
        'trades',
        'closedAt'
      ])
    })
  })
}
