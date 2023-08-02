const _ = require('lodash')
const chance = require('chance')()

const store = {}

function Factory (name) {
  return store[name]
}

Factory.define = function define (name, builder, defineOpts = {}) {
  store[name] = {
    name,
    build: function build (overrides = {}, buildOpts = {}) {
      const models = []

      overrides = overrides || {}
      buildOpts = _.defaults(buildOpts, { count: 1 })

      for (let i = 0; i < buildOpts.count; i++) {
        // const attributes = _.cloneDeep(builder(chance, overrides, models))
        const attributes = builder(overrides, chance, models)

        models.push(attributes)
      }

      return models.length > 1 ? models : models[0]
    }
  }

  return this
}

module.exports = Factory
