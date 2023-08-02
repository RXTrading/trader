const { expect, Factory, chance } = require('../helpers')

const Exchange = require('../../lib/exchanges/base')
const { ExchangeOrder } = require('../../lib/models')

describe('Exchanges: Base', () => {
  describe('constructor', () => {
    describe('opts', () => {
      describe('markets', () => {
        it('must be an array', () => {
          let thrownErr = null

          try {
            new Exchange({ markets: chance.integer() }) /* eslint-disable-line no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('markets must be an array')
        })

        describe('items', () => {
          it('must be an instance of Market', () => {
            let thrownErr = null

            try {
              new Exchange({ markets: [chance.integer()] }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('markets[0] must be an instance of the Market class')
          })
        })

        it('defaults to an empty array', () => {
          const exchange = new Exchange({ markets: undefined })

          expect(exchange.getMarkets()).to.eql([])
        })
      })

      describe('balances', () => {
        it('must be an array', () => {
          let thrownErr = null

          try {
            new Exchange({ balances: chance.integer() }) /* eslint-disable-line no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('balances must be an array')
        })

        describe('items', () => {
          it('must be an instance of Balance', () => {
            let thrownErr = null

            try {
              new Exchange({ balances: [chance.integer()] }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('balances[0] must be an instance of the Balance class')
          })
        })

        it('defaults to an empty array', () => {
          const exchange = new Exchange({ balances: undefined })

          expect(exchange.getBalances()).to.eql([])
        })
      })

      describe('orders', () => {
        it('must be an array', () => {
          let thrownErr = null

          try {
            new Exchange({ orders: chance.integer() }) /* eslint-disable-line no-new */
          } catch (err) {
            thrownErr = err
          }

          expect(thrownErr.type).to.eql('VALIDATION_ERROR')
          expect(thrownErr.data[0].message).to.eql('orders must be an array')
        })

        describe('items', () => {
          it('must be an instance of ExchangeOrder', () => {
            let thrownErr = null

            try {
              new Exchange({ orders: [chance.integer()] }) /* eslint-disable-line no-new */
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('orders[0] must be an instance of the ExchangeOrder class')
          })
        })

        it('defaults to an empty array', () => {
          const exchange = new Exchange({ orders: undefined })

          expect(exchange.getOrders()).to.eql([])
        })
      })
    })
  })

  describe('#getMarkets', () => {
    it('returns all local markets', () => {
      const markets = [Factory('market').build({ symbol: 'BTC/USDT' })]
      const exchange = new Exchange({ markets })

      expect(exchange.getMarkets()).to.eql(markets)
    })
  })

  describe('#getMarket', () => {
    describe('when symbol exists', () => {
      it('returns local market matching symbol', () => {
        const markets = [
          Factory('market').build({ symbol: 'ETH/USDT' }),
          Factory('market').build({ symbol: 'BTC/USDT' })
        ]
        const exchange = new Exchange({ markets })

        expect(exchange.getMarket('ETH/USDT')).to.eql(markets[0])
        expect(exchange.getMarket('BTC/USDT')).to.eql(markets[1])
      })
    })

    describe('when symbol does not exist', () => {
      it('returns undefined', () => {
        const markets = [
          Factory('market').build({ symbol: 'ETH/USDT' }),
          Factory('market').build({ symbol: 'LTC/USDT' })
        ]
        const exchange = new Exchange({ markets })

        expect(exchange.getMarket('BTC/USDT')).to.eql(undefined)
      })
    })
  })

  describe('#getBalances', () => {
    it('returns all local balances', () => {
      const balances = [Factory('balance').build({ symbol: 'BTC' }), Factory('balance').build({ symbol: 'ETH' })]
      const exchange = new Exchange({ balances })

      expect(exchange.getBalances()).to.eql(balances)
    })
  })

  describe('#getBalance', () => {
    const balances = [Factory('balance').build({ symbol: 'BTC' }), Factory('balance').build({ symbol: 'USDT' })]

    describe('when symbol exists', () => {
      it('returns local balance matching symbol', () => {
        const exchange = new Exchange({ balances })

        expect(exchange.getBalance('BTC')).to.eql(balances[0])
        expect(exchange.getBalance('USDT')).to.eql(balances[1])
      })
    })

    describe('when symbol does not exist', () => {
      it('returns undefined', () => {
        const exchange = new Exchange({ balances })

        expect(exchange.getMarket('ETH')).to.eql(undefined)
      })
    })
  })

  describe('#getOrders', () => {
    it('returns all local orders', () => {
      const orders = [Factory('exchangeOrder').build(), Factory('exchangeOrder').build()]
      const exchange = new Exchange({ orders })

      expect(exchange.getOrders()).to.eql(orders)
    })
  })

  describe('#getOrder', () => {
    let orders

    it('returns local order', () => {
      orders = [
        Factory('exchangeOrder').build({ status: ExchangeOrder.statuses.FILLED }),
        Factory('exchangeOrder').build({ status: ExchangeOrder.statuses.NEW })
      ]
      const exchange = new Exchange({ orders })

      expect(exchange.getOrder(orders[0].id)).to.eql(orders[0])
      expect(exchange.getOrder(orders[1].id)).to.eql(orders[1])
    })
  })

  describe('#createOrder', () => {
    it('throws error', () => {
      const exchange = new Exchange()
      let thrownErr = null

      try {
        exchange.createOrder()
      } catch (err) {
        thrownErr = err
      }

      expect(thrownErr.message).to.eql('createOrder not implemented')
    })
  })

  describe('#evaluate', () => {
    it('throws error', () => {
      const exchange = new Exchange()
      let thrownErr = null

      try {
        exchange.evaluate()
      } catch (err) {
        thrownErr = err
      }

      expect(thrownErr.message).to.eql('evaluate not implemented')
    })
  })
})
