class ExtendableError extends Error {
  constructor (message = '') {
    super(message)

    Object.defineProperty(this, 'message', {
      configurable: true,
      enumerable: false,
      value: message,
      writable: true
    })

    Object.defineProperty(this, 'name', {
      configurable: true,
      enumerable: false,
      value: this.constructor.name,
      writable: true
    })

    if (Object.prototype.hasOwnProperty.call(Error, 'captureStackTrace')) {
      Error.captureStackTrace(this, this.constructor)
      return
    }

    Object.defineProperty(this, 'stack', {
      configurable: true,
      enumerable: false,
      value: new Error(message).stack,
      writable: true
    })
  }
}

class ValidationError extends ExtendableError {
  constructor (message, type, data) {
    super(message || 'Validation error')
    this.code = 422
    this.type = type || 'VALIDATION_ERROR'
    this.data = data || {}
  }
}

module.exports = { ValidationError, ExtendableError }
