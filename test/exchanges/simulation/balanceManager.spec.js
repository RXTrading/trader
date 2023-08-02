const { expect, Factory } = require('../../helpers')

const BalanceManager = require('../../../lib/exchanges/simulation/balanceManager')
const { Balance, ExchangeOrder } = require('../../../lib/models')

describe('Exchanges: Simulation BalancerManager', () => {
  describe('#updateFromOrder', () => {
    const market = Factory('market').build({ symbol: 'BTC/USDT' })
    let balances

    beforeEach(() => {
      balances = [
        new Balance({ symbol: 'BTC', free: 100, total: 100 }),
        new Balance({ symbol: 'USDT', free: 1000, total: 1000 })
      ]
    })

    describe('when balance for base symbol does not exist', () => {
      const order = Factory('exchangeOrder').build({
        side: ExchangeOrder.sides.BUY,
        quoteQuantity: 100,
        price: 10,
        baseQuantityGross: 10,
        baseQuantityNet: 9.95,
        quoteQuantityGross: 100,
        quoteQuantityNet: 100
      })

      it('creates it', () => {
        const balances = [
          new Balance({ symbol: 'USDT', free: 1000, total: 1000 })
        ]
        const manager = new BalanceManager(balances)
        manager.updateFromOrder(order, market)

        expect(balances[1]).to.deep.include({
          free: '9.95',
          total: '9.95'
        })
      })
    })

    describe('when balance for quote symbol does not exist', () => {
      const order = Factory('exchangeOrder').build({
        side: ExchangeOrder.sides.SELL,
        baseQuantity: 10,
        price: 10,
        baseQuantityGross: 10,
        baseQuantityNet: 10,
        quoteQuantityGross: 100,
        quoteQuantityNet: 99.5
      })

      it('creates it', () => {
        const balances = [
          new Balance({ symbol: 'BTC', free: 100, total: 100 })
        ]
        const manager = new BalanceManager(balances)
        manager.updateFromOrder(order, market)

        expect(balances[1]).to.deep.include({
          free: '99.5',
          total: '99.5'
        })
      })
    })

    describe('when SIDE is BUY', () => {
      const order = Factory('exchangeOrder').build({
        side: ExchangeOrder.sides.BUY,
        quoteQuantity: 100,
        price: 10,
        baseQuantityGross: 10,
        baseQuantityNet: 9.95,
        quoteQuantityGross: 100,
        quoteQuantityNet: 100
      })

      it('adds baseQuantityNet to base balance free and total', () => {
        const manager = new BalanceManager(balances)
        manager.updateFromOrder(order, market)

        expect(balances[0]).to.deep.include({
          free: '109.95',
          total: '109.95'
        })
      })

      it('removes quoteQuantityGross from quote balance free and total', () => {
        const manager = new BalanceManager(balances)
        manager.updateFromOrder(order, market)

        expect(balances[1]).to.deep.include({
          free: '900',
          total: '900'
        })
      })
    })

    describe('when SIDE is SELL', () => {
      const order = Factory('exchangeOrder').build({
        side: ExchangeOrder.sides.SELL,
        baseQuantity: 10,
        price: 10,
        baseQuantityGross: 10,
        baseQuantityNet: 10,
        quoteQuantityGross: 100,
        quoteQuantityNet: 99.5
      })

      it('removes baseQuantityGross from base balance free and total', () => {
        const manager = new BalanceManager(balances)
        manager.updateFromOrder(order, market)

        expect(balances[0]).to.deep.include({
          free: '90',
          total: '90'
        })
      })

      it('adds quoteQuantityNet to quote balance free and total', () => {
        const manager = new BalanceManager(balances)
        manager.updateFromOrder(order, market)

        expect(balances[1]).to.deep.include({
          free: '1099.5',
          total: '1099.5'
        })
      })
    })
  })

  describe('#lockFromOrder', () => {
    const market = Factory('market').build({ symbol: 'BTC/USDT' })
    let balances

    beforeEach(() => {
      balances = [
        new Balance({ symbol: 'BTC', free: 1000, used: 0, total: 1000 }),
        new Balance({ symbol: 'USDT', free: 1000, used: 0, total: 1000 })
      ]
    })

    describe('and side is BUY', () => {
      const order = Factory('exchangeOrder').build({
        type: ExchangeOrder.types.LIMIT,
        side: ExchangeOrder.sides.BUY,
        quoteQuantity: 100,
        price: 10,
        baseQuantityGross: 10,
        baseQuantityNet: 9.95,
        quoteQuantityGross: 100,
        quoteQuantityNet: 100
      })

      it('locks quoteQuantity amount for quote balance', () => {
        const manager = new BalanceManager(balances)
        manager.lockFromOrder(order, market)

        expect(balances[1]).to.deep.include({
          free: '900',
          used: '100'
        })
      })
    })

    describe('and side is SELL', () => {
      const order = Factory('exchangeOrder').build({
        type: ExchangeOrder.types.LIMIT,
        side: ExchangeOrder.sides.SELL,
        baseQuantity: 10,
        price: 10,
        baseQuantityGross: 10,
        baseQuantityNet: 9.95,
        quoteQuantityGross: 100,
        quoteQuantityNet: 100
      })

      it('locks baseQuantity amount for base balance', () => {
        const manager = new BalanceManager(balances)
        manager.lockFromOrder(order, market)

        expect(balances[0]).to.deep.include({
          free: '990',
          used: '10'
        })
      })
    })
  })

  describe('#lock', () => {
    const market = Factory('market').build({ symbol: 'BTC/USDT' })
    let balances

    beforeEach(() => {
      balances = [
        new Balance({ symbol: 'BTC', free: 100, used: 0, total: 100 }),
        new Balance({ symbol: 'USDT', free: 1000, used: 0, total: 1000 })
      ]
    })

    it('locks amount for symbol', () => {
      const manager = new BalanceManager(balances)
      manager.lock(market.base, 10)

      expect(balances[0]).to.deep.include({
        free: '90',
        used: '10'
      })
    })
  })

  describe('#unlockFromOrder', () => {
    const market = Factory('market').build({ symbol: 'BTC/USDT' })
    let balances

    beforeEach(() => {
      balances = [
        new Balance({ symbol: 'BTC', free: 800, used: 200, total: 1000 }),
        new Balance({ symbol: 'USDT', free: 800, used: 200, total: 1000 })
      ]
    })

    describe('and side is BUY', () => {
      const order = Factory('exchangeOrder').build({
        type: ExchangeOrder.types.LIMIT,
        side: ExchangeOrder.sides.BUY,
        quoteQuantity: 100,
        price: 10,
        baseQuantityGross: 10,
        baseQuantityNet: 9.95,
        quoteQuantityGross: 100,
        quoteQuantityNet: 100
      })

      it('unlocks quoteQuantityGross amount for quote balance', () => {
        const manager = new BalanceManager(balances)
        manager.unlockFromOrder(order, market)

        expect(balances[1]).to.deep.include({
          free: '900',
          used: '100'
        })
      })
    })

    describe('and side is SELL', () => {
      const order = Factory('exchangeOrder').build({
        type: ExchangeOrder.types.LIMIT,
        side: ExchangeOrder.sides.SELL,
        baseQuantity: 10,
        price: 10,
        baseQuantityGross: 10,
        baseQuantityNet: 9.95,
        quoteQuantityGross: 100,
        quoteQuantityNet: 100
      })

      it('unlocks baseQuantityGross amount for base balance', () => {
        const manager = new BalanceManager(balances)
        manager.unlockFromOrder(order, market)

        expect(balances[0]).to.deep.include({
          free: '810',
          used: '190'
        })
      })
    })
  })

  describe('#unlock', () => {
    const market = Factory('market').build({ symbol: 'BTC/USDT' })
    let balances

    beforeEach(() => {
      balances = [
        new Balance({ symbol: 'BTC', free: 80, used: 20, total: 100 }),
        new Balance({ symbol: 'USDT', free: 1000, used: 0, total: 1000 })
      ]
    })

    it('unlocks amount for symbol', () => {
      const manager = new BalanceManager(balances)
      manager.unlock(market.base, 10)

      expect(balances[0]).to.deep.include({
        free: '90',
        used: '10'
      })
    })
  })
})
