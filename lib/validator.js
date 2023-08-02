const Validator = require('fastest-validator')

const validatorConfig = require('../config/validator')

const validator = new Validator(validatorConfig)

function validate (params = {}, schema = {}) {
  const check = validator.compile(schema)

  return check(params)
}

module.exports = { validator, validate }
