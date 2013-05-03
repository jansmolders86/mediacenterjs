"use strict"

# Extends generic [`Service`](Service.html) class.
UPNP = require 'upnp-device'

class MyService extends UPNP.Service

  constructor: ->
    @_stateVars =
      Target: { value: 0,  evented: no }
      Status: { value: 0,  evented: yes }
    super


  # ## Static service properties.
  type: 'MyService'
  serviceDescription: __dirname + '/MyService.xml'

  # State variable actions and associated XML element names.
  stateActions:
    GetTarget: 'RetTargetValue'
    GetStatus: 'ResultStatus'

  # Handle actions coming from `requestHandler`.
  actionHandler: (action, options, cb) ->
    return @getStateVar action, @stateActions[action], cb if action of @stateActions

    switch action
      when 'SetTarget'
        @setTarget options, cb
      else
        cb null, @buildSoapError new SoapError 401

  setTarget: (options, cb) ->
    @stateVars['Target'] = options['NewTargetValue'][0]
    # perfect machine
    @stateVars['Status'] = options['NewTargetValue'][0]
    cb null, @buildSoapResponse 'SetTarget',
      Source: @stateVars.Target, Sink: ''

module.exports = MyService
