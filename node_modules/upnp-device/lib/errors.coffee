"use strict"

http = require 'http'

# Use http module's `STATUS_CODES` static to get error messages.
class exports.HttpError extends Error
  constructor: (@code) ->
    @message = http.STATUS_CODES[@code]

# Error object with predefined UPnP SOAP error code-message combinations.
class exports.SoapError extends Error
  constructor: (@code) ->
    STATUS_CODES =
      401: "Invalid Action"
      402: "Invalid Args"
      404: "Invalid Var"
      501: "Action Failed"
      600: "Argument Value Invalid"
      601: "Argument Value Out of Range"
      602: "Optional Action Not Implemented"
      604: "Human Intervention Required"
      701: "No Such Object"
      709: "Invalid Sort Criteria"
      710: "No such container"
    @message = STATUS_CODES[@code]
