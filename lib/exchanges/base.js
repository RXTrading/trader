const { ValidationError } = require('../errors')
const { validate } = require('../validator')

const { Market, Balance, ExchangeOrder } = require('../models')

class Exchange {
  markets
  balances
  orders

  constructor (opts = {}) {
    this.#validateAndSanitizeOpts(opts)

    this.markets = opts.markets
    this.balances = opts.balances
    this.orders = opts.orders
  }

  getMarkets () {
    return this.markets
  }

  getMarket (symbol) {
    return this.markets.find(market => market.symbol === symbol)
  }

  getBalances () {
    return this.balances
  }

  getBalance (symbol) {
    return this.balances.find(balance => balance.symbol === symbol)
  }

  getOrders () {
    return this.orders
  }

  getOrder (id) {
    return this.orders.find(order => order.id === id)
  }

  createOrder (params = {}) {
    throw new Error('createOrder not implemented')
  }

  evaluate (params = {}) {
    throw new Error('evaluate not implemented')
  }

  #validateAndSanitizeOpts (opts = {}) {
    const valid = validate(opts, {
      markets: { type: 'array', items: { type: 'class', instanceOf: Market }, optional: true, default: [] },
      balances: { type: 'array', items: { type: 'class', instanceOf: Balance }, optional: true, default: [] },
      orders: { type: 'array', items: { type: 'class', instanceOf: ExchangeOrder }, optional: true, default: [] }
    })

    if (valid !== true) {
      throw new ValidationError(null, null, valid)
    }
  }
}

module.exports = Exchange
