module.exports = {
  useNewCustomCheckerFunction: true,
  messages: {
    required: '{field} is required',
    orRequired: '{field} or {expected} is required',
    string: '{field} must be a string',
    stringEmpty: '{field} is required',
    stringMin: '{field} length must be greater than or equal to {expected} characters long',
    stringMax: '{field} length must be less than or equal to {expected} characters long',
    stringLength: '{field} length must be {expected} characters long',
    stringPattern: '{field} fails to match the required pattern',
    stringContains: '{field} must contain the {expected} text',
    stringEnum: '{field} does not match any of the allowed values',
    stringNumeric: '{field} must be a numeric string',
    stringAlpha: '{field} must be an alphabetic string',
    stringAlphanum: '{field} must be an alphanumeric string',
    stringAlphadash: '{field} must be an alphadash string',
    stringHex: '{field} must be a hex string',
    stringSingleLine: '{field} must be a single line string',
    stringBase64: '{field} must be a base64 string',
    number: '{field} must be a number',
    numberMin: '{field} must be greater than or equal to {expected}',
    numberMax: '{field} must be less than or equal to {expected}',
    numberEqual: '{field} must be equal to {expected}',
    numberNotEqual: '{field} can\'t be equal to {expected}',
    numberInteger: '{field} must be an integer',
    numberPositive: '{field} must be a positive number',
    numberNegative: '{field} must be a negative number',
    array: '{field} must be an array',
    arrayEmpty: '{field} must not be an empty array',
    arrayMin: '{field} must contain at least {expected} items',
    arrayMax: '{field} must contain less than or equal to {expected} items',
    arrayLength: '{field} must contain {expected} items',
    arrayContains: '{field} must contain the {expected} item',
    arrayUnique: 'The {actual} value in {field} does not unique the {expected} values',
    arrayEnum: 'The {actual} value in {field} does not match any of the {expected} values',
    tuple: '{field} must be an array',
    tupleEmpty: '{field} must not be an empty array',
    tupleLength: '{field} must contain {expected} items',
    boolean: '{field} must be a boolean',
    function: '{field} must be a function',
    date: '{field} must be a Date',
    dateMin: '{field} must be greater than or equal to {expected}',
    dateMax: '{field} must be less than or equal to {expected}',
    forbidden: '{field} is forbidden',
    email: '{field} must be a valid e-mail',
    emailEmpty: '{field} must not be empty',
    emailMin: '{field} length must be greater than or equal to {expected} characters long',
    emailMax: '{field} length must be less than or equal to {expected} characters long',
    url: '{field} must be a valid URL',
    enumValue: '{field} must match one of {expected}',
    equalValue: '{field} value must be equal to {expected}',
    equalField: '{field} value must be equal to {expected} field value',
    object: '{field} must be an Object',
    objectStrict: 'The object {field} contains forbidden keys: {actual}',
    objectMinProps: '"The object {field} must contain at least {expected} properties',
    objectMaxProps: '"The object {field} must contain {expected} properties at most',
    uuid: '{field} must be a valid UUID',
    uuidVersion: '{field} must be a valid UUID version provided',
    mac: '{field} must be a valid MAC address',
    luhn: '{field} must be a valid checksum luhn',
    classInstanceOf: '{field} must be an instance of the {expected} class',
    insufficientBalance: '{field} is greater than available balance',
    doesNotExist: '{field} does not exist',
    supportsOnly: '{field} supports {expected} only'
  }
}
