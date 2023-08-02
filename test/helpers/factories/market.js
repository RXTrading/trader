const _ = require('lodash')

const { Market } = require('../../../lib/models')

module.exports = Factory => {
  Factory.define('market', function (overrides, chance) {
    const params = _.defaultsDeep({}, overrides, { symbol: 'BTC/USDT' })
    const [base, quote] = params.symbol.split('/')

    return new Market(
      _.defaultsDeep({}, overrides, {
        symbol: params.symbol,
        base,
        quote
      })
    )
  })
}
