const Trader = require('./lib/trader')
const SignalManager = require('./lib/signalManager')
const PositionManager = require('./lib/positionManager')
const RiskManager = require('./lib/riskManager')
const exchanges = require('./lib/exchanges')
const BalanceManager = require('./lib/exchanges/simulation/balanceManager')
const models = require('./lib/models')

module.exports = { Trader, ...exchanges, BalanceManager, ...models, SignalManager, PositionManager, RiskManager }
