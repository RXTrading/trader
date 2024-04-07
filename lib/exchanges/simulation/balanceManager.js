const BigNumber = require('bignumber.js')

const { OrderOptions, Balance } = require('../../models')

class BalanceManager {
  #balances

  constructor (balances) {
    this.#balances = balances
  }

  getBalance (symbol) {
    return this.#balances.find(b => b.symbol === symbol)
  }

  updateFromOrder (order = {}, market = {}) {
    // Ensure balance exists for base asset
    if (!this.getBalance(market.base)) {
      this.#balances.push(new Balance({ symbol: market.base }))
    }

    // Ensure balance exists for quote asset
    if (!this.getBalance(market.quote)) {
      this.#balances.push(new Balance({ symbol: market.quote }))
    }

    const baseBalance = this.getBalance(market.base)
    const quoteBalance = this.getBalance(market.quote)

    if (order.side === OrderOptions.sides.BUY) {
      baseBalance.set({
        free: BigNumber(baseBalance.free).plus(order.baseQuantityNet).toFixed(),
        total: BigNumber(baseBalance.total).plus(order.baseQuantityNet).toFixed()
      })

      quoteBalance.set({
        free: BigNumber(quoteBalance.free).minus(order.quoteQuantityGross).toFixed(),
        total: BigNumber(quoteBalance.total).minus(order.quoteQuantityGross).toFixed()
      })
    } else if (order.side === OrderOptions.sides.SELL) {
      baseBalance.set({
        free: BigNumber(baseBalance.free).minus(order.baseQuantityGross).toFixed(),
        total: BigNumber(baseBalance.total).minus(order.baseQuantityGross).toFixed()
      })

      quoteBalance.set({
        free: BigNumber(quoteBalance.free).plus(order.quoteQuantityNet).toFixed(),
        total: BigNumber(quoteBalance.total).plus(order.quoteQuantityNet).toFixed()
      })
    }
  }

  lockFromOrder (order, market) {
    if (order.side === OrderOptions.sides.BUY) {
      this.lock(market.quote, order.quoteQuantity)
    } else {
      this.lock(market.base, order.baseQuantity)
    }
  }

  lock (symbol, amount) {
    const balance = this.getBalance(symbol)

    balance.set({
      free: BigNumber(balance.free).minus(amount).toFixed(),
      used: BigNumber(balance.used).plus(amount).toFixed()
    })
  }

  unlockFromOrder (order, market) {
    if (order.side === OrderOptions.sides.BUY) {
      this.unlock(market.quote, order.quoteQuantity)
    } else {
      this.unlock(market.base, order.baseQuantity)
    }
  }

  unlock (symbol, amount) {
    const balance = this.getBalance(symbol)

    balance.set({
      free: BigNumber(balance.free).plus(amount).toFixed(),
      used: BigNumber(balance.used).minus(amount).toFixed()
    })
  }
}

module.exports = BalanceManager
