# Extend underscore library with own utility functions and export.

"use strict"

async = require 'async'
_ = require 'underscore'

_.async = async

# Make each key/value pair in object into separate objects in `arr`.
_.mixin objectToArray: (obj, arr = []) ->
  throw new TypeError("Not an object.") unless _.isObject obj
  Object.keys(obj).map (key) ->
    o = {}
    o[key] = obj[key]
    arr.push o
  arr

# Sort an object on any number of keys.
# An argument is a string or an object with `name`, `primer`, `reverse`.
_.mixin sortObject: ->
  fields = [].slice.call arguments
  (A, B) ->
    for field in fields
      key = if _.isObject field then field.name else field
      primer = if _.isFunction field.primer then field.primer else (v) -> v
      reverse = if field.reverse then -1 else 1
      a = primer A[key]
      b = primer B[key]
      result =
        if a < b
          reverse * -1
        else if a > b
          reverse * 1
        else
          reverse * 0
      break if result isnt 0
    result

module.exports = _
