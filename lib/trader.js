const _ = require('lodash')
const EventEmitter = require('eventemitter2')

const { ValidationError } = require('./errors')
const { validate } = require('./validator')

const SignalManager = require('./signalManager')
const PositionManager = require('./positionManager')
const RiskManager = require('./riskManager')

const { Position } = require('./models')

class TraderValidationError extends ValidationError {
  constructor (data) {
    super('Trader validation error', 'TRADER_VALIDATION_ERROR', data)
  }
}

class Trader extends EventEmitter {
  #exchange
  #signalManager
  #positionManager
  #riskManager

  constructor (opts = {}) {
    super({ wildcard: true, delimiter: '.' })

    this.#validateAndSanitizeOpts(opts)

    this.#exchange = opts.exchange
    this.#signalManager = new SignalManager({ trader: this, ..._.pick(opts, 'backtest') })
    this.#positionManager = new PositionManager({ trader: this, ..._.pick(opts, 'positions') })
    this.#riskManager = new RiskManager({ trader: this })
  }

  get exchange () {
    return this.#exchange
  }

  get positions () {
    return this.#positionManager.all
  }

  processSignal (signal = {}) {
    return this.#signalManager.process(signal)
  }

  async evaluate (options = {}) {
    options = _.defaults({}, options, { exchange: true, positions: true })
    const evalOptions = _.omit(options, ['exchange', 'positions'])

    if (options.exchange) {
      this.#exchange.evaluate()
    }

    if (options.positions) {
      await this.#positionManager.evaluate(evalOptions)
    }
  }

  calculatePosition (params) {
    return this.#riskManager.calculatePosition(params)
  }

  #validateAndSanitizeOpts (opts) {
    const sanitizedOpts = _.cloneDeep(opts)

    const valid = validate(sanitizedOpts, {
      exchange: { type: 'object' },
      positions: { type: 'array', optional: true, items: { type: 'class', instanceOf: Position } },
      backtest: { type: 'boolean', default: false, convert: true }
    })

    if (valid !== true) {
      throw new TraderValidationError(valid)
    }

    return sanitizedOpts
  }
}

module.exports = Trader
