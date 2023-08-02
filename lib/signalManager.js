const _ = require('lodash')

const { ValidationError } = require('./errors')
const { validate } = require('./validator')
const { Signal } = require('./models')

class SignalManagerValidationError extends ValidationError {
  constructor (data) {
    super('Signal manager validation error', 'SIGNAL_MANAGER_VALIDATION_ERROR', data)
  }
}

class SignalManager {
  #trader
  #opts

  constructor (opts = {}) {
    const sanitizedOpts = this.#validateAndSanitizeOpts(opts)
    this.#trader = opts.trader
    this.#opts = sanitizedOpts
  }

  async process (signal = {}) {
    signal = new Signal(signal)

    if (this.#opts.backtest) {
      signal.set({ params: { timestamp: signal.timestamp, ...signal.params } })
    }

    await this.#trader.emitAsync('signal.received', signal)

    try {
      if (signal.type === Signal.types.OPEN_POSITION) {
        await this.#trader.emitAsync('position.open', { signalId: signal.id, ...signal.params })
      } else if (signal.type === Signal.types.CLOSE_POSITION) {
        await this.#trader.emitAsync('position.close', signal.params)
      } else if (signal.type === Signal.types.CLOSE_ALL_POSITIONS) {
        await this.#trader.emitAsync('position.closeAll', signal.params)
      }

      signal.set({ status: Signal.statuses.ACCEPTED })
    } catch (err) {
      if (err.code === 422) {
        signal.set({
          status: Signal.statuses.REJECTED,
          reason: { message: err.message, errors: err.data }
        })
      } else {
        throw err
      }
    }

    await this.#trader.emitAsync('signal.updated', signal)

    return signal
  }

  #validateAndSanitizeOpts (opts) {
    const sanitizedOpts = _.cloneDeep(opts)

    const valid = validate(sanitizedOpts, {
      trader: { type: 'object', props: { emit: { type: 'function' } } },
      backtest: { type: 'boolean', default: false, convert: true }
    })

    if (valid !== true) {
      throw new SignalManagerValidationError(valid)
    }

    return sanitizedOpts
  }
}

module.exports = SignalManager
