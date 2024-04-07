const { expect, behaviours, chance, sinon, Factory } = require('./helpers')

const SignalManager = require('../lib/signalManager')
const Trader = require('../lib/trader')
const Exchange = require('../lib/exchanges/simulation')
const { ValidationError } = require('../lib/errors')
const { Signal, Position } = require('../lib/models')

describe('SignalManager', () => {
  describe('options', () => {
    const defaultParams = {
      trader: { emit: () => {} },
      backtest: chance.bool()
    }

    describe('trader', () => {
      behaviours.throwsSignalManagerValidationError('is required', {
        check: () => (new SignalManager({ ...defaultParams, trader: undefined })),
        expect: error => expect(error.data[0].message).to.eql('trader is required')
      })

      behaviours.throwsSignalManagerValidationError('is required', {
        check: () => (new SignalManager({ ...defaultParams, trader: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('trader must be an Object')
      })

      describe('props', () => {
        describe('emit', () => {
          behaviours.throwsSignalManagerValidationError('is required', {
            check: () => (new SignalManager({ ...defaultParams, trader: {} })),
            expect: error => expect(error.data[0].message).to.eql('trader.emit is required')
          })

          behaviours.throwsSignalManagerValidationError('must be a function', {
            check: () => (new SignalManager({ ...defaultParams, trader: { emit: chance.string() } })),
            expect: error => expect(error.data[0].message).to.eql('trader.emit must be a function')
          })
        })
      })
    })

    describe('backtest', () => {
      behaviours.throwsSignalManagerValidationError('must be boolean', {
        check: () => (new SignalManager({ ...defaultParams, backtest: chance.string() })),
        expect: error => expect(error.data[0].message).to.eql('backtest must be a boolean')
      })
    })
  })

  describe('#process', () => {
    describe('when signal is invalid', () => {
      behaviours.throwsValidationError('throws an error', {
        check: () => {
          const manager = new SignalManager({ trader: new Trader({ exchange: new Exchange() }) })

          return manager.process()
        },
        expect: error => expect(error.message).to.eql('Signal validation error')
      })
    })

    describe('when signal is valid', () => {
      describe('signal received event', () => {
        const trader = new Trader({ exchange: new Exchange() })
        let traderStub

        before(() => {
          traderStub = sinon.stub(trader, 'emitAsync')
          traderStub.withArgs('signal.received').returns()
          traderStub.withArgs('position.open').returns()
        })

        after(() => {
          traderStub.restore()
        })

        it('emits signal.received with signal', async () => {
          const manager = new SignalManager({ trader })
          const params = {
            type: Position.types.LONG,
            entries: Factory('orderOptions').build()
          }

          const signal = await manager.process({ type: Signal.types.OPEN_POSITION, params })

          expect(traderStub).to.have.been.calledWith('signal.received', signal)
        })
      })

      describe('and signal processing throws an error', () => {
        const trader = new Trader({ exchange: new Exchange() })
        const params = {
          exchange: 'binance',
          market: 'BTC/USDT',
          status: chance.pickone(Object.values(Position.statuses)),
          type: chance.pickone(Object.values(Position.types)),
          entries: Factory('orderOptions').build()
        }

        let error
        let traderStub

        describe('when error code is 422', () => {
          before(() => {
            error = new ValidationError('Validation error', null, [{ message: 'field is required' }])

            traderStub = sinon.stub(trader, 'emitAsync')
            traderStub.withArgs('signal.received').callThrough()
            traderStub.withArgs('position.open').rejects(error)
          })

          after(() => {
            traderStub.restore()
          })

          it('sets signal status to REJECTED with reason', async () => {
            const manager = new SignalManager({ trader })
            const signal = await manager.process({ type: Signal.types.OPEN_POSITION, params })

            expect(traderStub).to.have.been.calledWith('signal.received')
            expect(signal.status).to.eql(Signal.statuses.REJECTED)
            expect(signal.reason).to.eql({ message: error.message, errors: error.data })
          })
        })

        describe('when error code is not 422', () => {
          before(() => {
            traderStub = sinon.stub(trader, 'emitAsync')
            traderStub.withArgs('signal.received').callThrough()
            traderStub.withArgs('position.open').rejects(new Error('Something seriously went wrong'))
          })

          after(() => {
            traderStub.restore()
          })

          behaviours.throws('throws an error', undefined, {
            check: () => {
              const manager = new SignalManager({ trader })

              return manager.process({ type: Signal.types.OPEN_POSITION, params })
            },
            expect: error => expect(error.message).to.eql('Something seriously went wrong')
          })
        })
      })

      describe('and is backtesting', () => {
        const trader = new Trader({ exchange: new Exchange() })
        let traderStub

        before(() => {
          traderStub = sinon.stub(trader, 'emitAsync').resolves()
        })

        after(() => {
          traderStub.restore()
        })

        it('sets signal params.timestamp to signal timestamp', async () => {
          const manager = new SignalManager({ trader, backtest: true })
          const timestamp = chance.date()

          const signal = await manager.process({
            type: Signal.types.OPEN_POSITION,
            params: {
              timestamp,
              type: Position.types.LONG,
              entries: Factory('orderOptions').build()
            }
          })

          expect(signal.params.timestamp).to.eql(timestamp)
        })
      })

      describe('and is successfully processed', () => {
        const trader = new Trader({ exchange: new Exchange() })
        let traderStub

        before(() => {
          traderStub = sinon.stub(trader, 'emitAsync').resolves()
        })

        after(() => {
          traderStub.restore()
        })

        it('sets status to ACCEPTED', async () => {
          const manager = new SignalManager({ trader })
          const params = {
            exchange: 'binance',
            market: 'BTC/USDT',
            status: chance.pickone(Object.values(Position.statuses)),
            type: chance.pickone(Object.values(Position.types)),
            entries: Factory('orderOptions').build()
          }

          const signal = await manager.process({ type: Signal.types.OPEN_POSITION, params })

          expect(signal.status).to.eql(Signal.statuses.ACCEPTED)
        })
      })

      describe('and signal is processed', () => {
        const trader = new Trader({ exchange: new Exchange() })
        let traderStub

        before(() => {
          traderStub = sinon.stub(trader, 'emitAsync')
          traderStub.withArgs('signal.received').callThrough()
        })

        after(() => {
          traderStub.restore()
        })

        it('emits signal.updated with signal', async () => {
          const manager = new SignalManager({ trader })
          const params = {
            exchange: 'binance',
            market: 'BTC/USDT',
            status: chance.pickone(Object.values(Position.statuses)),
            type: chance.pickone(Object.values(Position.types)),
            entries: Factory('orderOptions').build()
          }

          const signal = await manager.process({ type: Signal.types.OPEN_POSITION, params })

          expect(traderStub).to.have.been.calledWith('signal.updated', signal)
        })
      })

      describe('and type is OPEN_POSITION', () => {
        const trader = new Trader({ exchange: new Exchange() })
        let traderStub

        before(() => {
          traderStub = sinon.stub(trader, 'emitAsync')
        })

        after(() => {
          traderStub.restore()
        })

        it('emits position.open with signal params', async () => {
          const manager = new SignalManager({ trader })
          const params = {
            exchange: 'binance',
            market: 'BTC/USDT',
            status: chance.pickone(Object.values(Position.statuses)),
            type: chance.pickone(Object.values(Position.types)),
            entries: Factory('orderOptions').build()
          }

          const signal = await manager.process({ type: Signal.types.OPEN_POSITION, params })

          expect(traderStub).to.have.been.calledWith('position.open', { signalId: signal.id, ...params })
        })
      })

      describe('and type is CLOSE_POSITION', () => {
        const trader = new Trader({ exchange: new Exchange() })
        let traderStub

        before(() => {
          traderStub = sinon.stub(trader, 'emitAsync')
        })

        after(() => {
          traderStub.restore()
        })

        it('emits position.close with signal params', async () => {
          const manager = new SignalManager({ trader })
          const params = { id: chance.guid({ version: 4 }) }

          await manager.process({ type: Signal.types.CLOSE_POSITION, params })

          expect(traderStub).to.have.been.calledWith('position.close', params)
        })
      })

      describe('and type is CLOSE_ALL_POSITIONS', () => {
        const trader = new Trader({ exchange: new Exchange() })
        let traderStub

        before(() => {
          traderStub = sinon.stub(trader, 'emitAsync')
        })

        after(() => {
          traderStub.restore()
        })

        it('emits position.closeAll', async () => {
          const manager = new SignalManager({ trader })

          await manager.process({ type: Signal.types.CLOSE_ALL_POSITIONS })

          expect(traderStub).to.have.been.calledWith('position.closeAll')
        })
      })
    })
  })
})
