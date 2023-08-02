const { expect, chance, BigNumber } = require('../helpers')

const Exchange = require('../../lib/exchanges/simulation')

describe('Exchanges: Simulation', () => {
  describe('#setTick', () => {
    const exchange = new Exchange()

    describe('tick', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          exchange.setTick()
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('tick is required')
      })

      it('must be a number', () => {
        let thrownErr = null

        try {
          exchange.setTick('twenty')
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('tick must be a number')
      })
    })

    it('sets the current tick', () => {
      const tick = chance.integer({ min: 0, max: 1000 })

      expect(exchange.getTick()).to.eql(undefined)
      exchange.setTick(tick)
      expect(exchange.getTick()).to.eql(BigNumber(tick).toFixed())
    })
  })

  describe('#setCandle', () => {
    const exchange = new Exchange()
    const defaultParams = {
      open: chance.floating({ min: 0.00, max: 10.00 }),
      high: chance.floating({ min: 0.00, max: 10.00 }),
      low: chance.floating({ min: 0.00, max: 10.00 }),
      close: chance.floating({ min: 0.00, max: 10.00 })
    }

    describe('candle', () => {
      it('is required', () => {
        let thrownErr = null

        try {
          exchange.setCandle()
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('candle.open is required')
      })

      it('must be an object', () => {
        let thrownErr = null

        try {
          exchange.setCandle(chance.string())
        } catch (err) {
          thrownErr = err
        }

        expect(thrownErr.type).to.eql('VALIDATION_ERROR')
        expect(thrownErr.data[0].message).to.eql('candle must be an Object')
      })

      describe('props', () => {
        describe('open', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              exchange.setCandle({ ...defaultParams, open: undefined })
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('candle.open is required')
          })

          it('must be a number', () => {
            let thrownErr = null

            try {
              exchange.setCandle({ ...defaultParams, open: 'twenty' })
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('candle.open must be a number')
          })
        })

        describe('high', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              exchange.setCandle({ ...defaultParams, high: undefined })
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('candle.high is required')
          })

          it('must be a number', () => {
            let thrownErr = null

            try {
              exchange.setCandle({ ...defaultParams, high: 'twenty' })
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('candle.high must be a number')
          })
        })

        describe('low', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              exchange.setCandle({ ...defaultParams, low: undefined })
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('candle.low is required')
          })

          it('must be a number', () => {
            let thrownErr = null

            try {
              exchange.setCandle({ ...defaultParams, low: 'twenty' })
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('candle.low must be a number')
          })
        })

        describe('close', () => {
          it('is required', () => {
            let thrownErr = null

            try {
              exchange.setCandle({ ...defaultParams, close: undefined })
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('candle.close is required')
          })

          it('must be a number', () => {
            let thrownErr = null

            try {
              exchange.setCandle({ ...defaultParams, close: 'twenty' })
            } catch (err) {
              thrownErr = err
            }

            expect(thrownErr.type).to.eql('VALIDATION_ERROR')
            expect(thrownErr.data[0].message).to.eql('candle.close must be a number')
          })
        })
      })
    })

    it('sets the current candle', () => {
      const candle = {
        open: chance.floating({ min: 0.00, max: 10.00 }),
        high: chance.floating({ min: 0.00, max: 10.00 }),
        low: chance.floating({ min: 0.00, max: 10.00 }),
        close: chance.floating({ min: 0.00, max: 10.00 })
      }

      expect(exchange.getCandle()).to.eql(undefined)

      exchange.setCandle(candle)

      expect(exchange.getCandle()).to.eql({
        open: BigNumber(candle.open).toFixed(),
        high: BigNumber(candle.high).toFixed(),
        low: BigNumber(candle.low).toFixed(),
        close: BigNumber(candle.close).toFixed()
      })
    })
  })
})
