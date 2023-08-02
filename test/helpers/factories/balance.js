const _ = require('lodash')

const { Balance } = require('../../../lib/models')

module.exports = Factory => {
  Factory.define('balance', function (overrides, chance) {
    return new Balance(
      _.defaultsDeep({}, overrides, {
        symbol: 'BTC',
        free: chance.integer({ min: 1 }),
        used: chance.integer({ min: 1 }),
        total: chance.integer({ min: 1 })
      })
    )
  })
}
