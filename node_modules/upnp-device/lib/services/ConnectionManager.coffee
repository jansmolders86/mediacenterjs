# Implements [ConnectionManager:1] [1] service for [MediaServer] [2] devices.
#
# [1]: http://upnp.org/specs/av/av1/
# [2]: MediaServer.html

"use strict"

# Extends generic [`Service`](Service.html) class.
Service = require './Service'

class ConnectionManager extends Service

  constructor: ->
    @_stateVars =
      SourceProtocolInfo: { value: '', evented: yes }
      SinkProtocolInfo: { value: '', evented: yes }
      CurrentConnectionIDs: { value: 0,  evented: yes }
    super


  # ## Static service properties.
  type: 'ConnectionManager'
  serviceDescription: __dirname + '/ConnectionManager.xml'

  # Optional actions not (yet) implemented.
  optionalActions: [ 'PrepareForConnection', 'ConnectionComplete' ]

  # State variable actions and associated XML element names.
  stateActions:
    GetCurrentConnectionIDs: 'ConnectionIDs'


  # Handle actions coming from `requestHandler`.
  actionHandler: (action, options, cb) ->
    return @optionalAction cb if action in @optionalActions
    return @getStateVar action, @stateActions[action], cb if action of @stateActions

    switch action
      when 'GetProtocolInfo'
        @makeProtocolInfo cb
      when 'GetCurrentConnectionInfo'
        @makeConnectionInfo cb
      else
        cb null, @buildSoapError new SoapError 401


  makeProtocolInfo: (cb) ->
    cb null, @buildSoapResponse 'GetProtocolInfo',
      Source: @stateVars.SourceProtocolInfo, Sink: ''


  makeConnectionInfo: (cb) ->
    # `PrepareForConnection` is not implemented, so only `ConnectionID`
    # available is `0`. The following are defaults from specification.
    cb null, @buildSoapResponse 'GetCurrentConnectionInfo',
      RcsID: -1
      AVTransportID: -1
      ProtocolInfo: @protocols.join(',')
      PeerConnectionManager: ''
      PeerConnectionID: -1
      Direction: 'Output'
      Status: 'OK'

module.exports = ConnectionManager
