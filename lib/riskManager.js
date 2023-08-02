const _ = require('lodash')
const BigNumber = require('bignumber.js')

const { ValidationError } = require('./errors')
const { validate } = require('./validator')

const down = BigNumber.ROUND_DOWN
const up = BigNumber.ROUND_UP

class RiskManagerValidationError extends ValidationError {
  constructor (data) {
    super('Risk manager validation error', 'RISK_MANAGER_VALIDATION_ERROR', data)
  }
}

class RiskManager {
  #trader

  constructor (opts = {}) {
    this.#validateAndSanitizeOpts(opts)

    this.#trader = opts.trader
  }

  calculatePosition (params = {}) {
    const sanitizedParams = this.#validateAndSanitizeCalculateParams(params)
    const market = this.#trader.exchange.getMarket(params.market)
    const basePrecision = market.precision.amount
    const quotePrecision = market.precision.price

    const response = {
      capital: sanitizedParams.capital,
      risk: sanitizedParams.risk,
      riskValue: BigNumber(sanitizedParams.capital).multipliedBy(sanitizedParams.risk).toFixed(),
      entryPrice: sanitizedParams.entryPrice,
      stopLoss: sanitizedParams.stopLoss
    }

    response.riskPerAsset = BigNumber(response.entryPrice).minus(response.stopLoss).abs().toFixed(quotePrecision, up)
    response.positionSize = BigNumber(response.riskValue).dividedBy(response.riskPerAsset).toFixed(basePrecision, down)
    response.positionValue = BigNumber(response.positionSize).multipliedBy(response.entryPrice).toFixed(quotePrecision, up)

    if (BigNumber(response.positionValue).isGreaterThan(response.capital)) {
      response.positionSize = BigNumber(response.capital).dividedBy(response.entryPrice).toFixed(basePrecision, down)
      response.positionValue = BigNumber(response.positionSize).multipliedBy(response.entryPrice).toFixed(quotePrecision, up)
    }

    response.capitalAtRisk = BigNumber(response.positionSize).multipliedBy(response.riskPerAsset).toFixed(quotePrecision, up)

    return response
  }

  static #convertToBigNumber (value) {
    const bignumber = BigNumber(value).toFixed()

    return bignumber === 'NaN' ? value : bignumber
  }

  #validateAndSanitizeOpts (opts) {
    return this.#validateAndSanitize(opts, {
      trader: { type: 'object' }
    })
  }

  #validateAndSanitizeCalculateParams (params) {
    return this.#validateAndSanitize(params, {
      capital: { type: 'number', convert: true, custom: value => RiskManager.#convertToBigNumber(value) },
      risk: { type: 'number', default: 0.01, min: 0, max: 1, convert: true, custom: value => RiskManager.#convertToBigNumber(value) },
      market: { type: 'string', custom: (...args) => this.#validateMarket(...args) },
      entryPrice: { type: 'number', convert: true, custom: value => RiskManager.#convertToBigNumber(value) },
      stopLoss: { type: 'number', default: 0, convert: true, custom: value => RiskManager.#convertToBigNumber(value) }
    })
  }

  #validateMarket (value, errors) {
    const market = this.#trader.exchange.getMarket(value)

    if (!market) {
      errors.push({ type: 'doesNotExist' })
    }

    return value
  }

  #validateAndSanitize (params, schema) {
    const sanitizedOpts = _.cloneDeep(params)
    const valid = validate(sanitizedOpts, schema)

    if (valid !== true) {
      throw new RiskManagerValidationError(valid)
    }

    return sanitizedOpts
  }
}

module.exports = RiskManager
