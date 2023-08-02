const _ = require('lodash')
const BigNumber = require('bignumber.js')

const { ValidationError } = require('../errors')
const { validate } = require('../validator')

class Model {
  constructor (props = {}, options = {}) {
    options = _.defaultsDeep({}, options, { set: true })

    if (options.set) {
      this.set(props)
    }
  }

  static get schema () {
    return {}
  }

  static convertToBigNumber (value) {
    const bignumber = BigNumber(value).toFixed()

    return bignumber === 'NaN' ? value : bignumber
  }

  set (props = {}) {
    const schema = this.constructor.schema

    props = _.merge(this, props)

    this.#validateAndSanitize(props, schema)
    this.#setPropsFromSchema(props, schema)
  }

  #setPropsFromSchema (props, schema) {
    for (const key in schema) {
      this[key] = props[key]
    }
  }

  #validateAndSanitize (params, schema) {
    const valid = validate(params, schema)

    if (valid !== true) {
      throw new ValidationError(`${this.constructor.name} validation error`, null, valid)
    }
  }
}

module.exports = Model
