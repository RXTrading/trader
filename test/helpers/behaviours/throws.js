const chai = require('chai')
const expect = chai.expect

function throws (itDesc, errorType, context = {}) {
  it(itDesc, async () => {
    let thrownErr = null

    try {
      await context.check()
    } catch (err) {
      thrownErr = err
    }

    if (context.debug) {
      console.log('thrownErr', thrownErr)
    }

    expect(thrownErr.type).to.eql(errorType)
    await context.expect(thrownErr)
  })
}

function throwsValidationError (itDesc, context) {
  throws(itDesc, 'VALIDATION_ERROR', context)
}

function throwsSimulationExchangeError (itDesc, context) {
  throws(itDesc, 'SIMULATION_EXCHANGE_ERROR', context)
}

function throwsPositionManagerValidationError (itDesc, context) {
  throws(itDesc, 'POSITION_MANAGER_VALIDATION_ERROR', context)
}

function throwsRiskManagerValidationError (itDesc, context) {
  throws(itDesc, 'RISK_MANAGER_VALIDATION_ERROR', context)
}

function throwsSignalManagerValidationError (itDesc, context) {
  throws(itDesc, 'SIGNAL_MANAGER_VALIDATION_ERROR', context)
}

function throwsTraderValidationError (itDesc, context) {
  throws(itDesc, 'TRADER_VALIDATION_ERROR', context)
}

module.exports = {
  throws,
  throwsValidationError,
  throwsSimulationExchangeError,
  throwsPositionManagerValidationError,
  throwsRiskManagerValidationError,
  throwsSignalManagerValidationError,
  throwsTraderValidationError
}
