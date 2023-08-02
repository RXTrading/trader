const chai = require('chai')
const chance = require('chance')()
const sinon = require('sinon')
const expect = chai.expect
const BigNumber = require('bignumber.js')
const moment = require('moment')

const Factory = require('./factory')

require('./factories')

chai.use(require('chai-samsam'))
chai.use(require('chai-as-promised'))
chai.use(require('chai-datetime'))
chai.use(require('chai-uuid'))
chai.use(require('dirty-chai'))
chai.use(require('sinon-chai'))

module.exports = {
  expect,
  sinon,
  chance,
  BigNumber,
  Factory,
  moment
}
