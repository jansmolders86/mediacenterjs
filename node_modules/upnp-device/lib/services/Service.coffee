# Implements [UPnP Device Architecture version 1.0] [1]
#
# [1]: http://upnp.org/sdcps-and-certification/standards/device-architecture-documents/

"use strict"

fs = require 'fs'
http = require 'http'
url = require 'url'
gen_uuid = require 'node-uuid'
xml = require 'xml'
{ Parser: XmlParser } = require 'xml2js'

{ HttpError, SoapError } = require '../errors'
_ = require '../utils'

# `Service` extends [`DeviceControlProtocol`](DeviceControlProtocol.html)
# with properties and methods common to devices and services.
DeviceControlProtocol = require '../DeviceControlProtocol'

class Service extends DeviceControlProtocol

  constructor: (@device) ->
    super
    @stateVars = {}
    for key, val of @_stateVars
      do (key, val) =>
        Object.defineProperty @stateVars, key,
          get: =>
            @_stateVars[key].value
          set: (value) =>
            @_stateVars[key].value = value
            @notify() if @_stateVars[key].evented


  # Control action. Most actions build a SOAP response and calls back.
  action: (action, data, cb) ->
    (new XmlParser).parseString data, (err, data) =>
      @actionHandler action, data['s:Envelope']['s:Body'][0]["u:#{action}"][0], cb


  # Create model attribute getter/setter property.
  attribute = (attr) ->
    Object.defineProperty @prototype, attr,
      get: -> @get attr
      set: (value) ->
        attrs = {}
        attrs[attr] = value
        @set attrs


  # Event subscriptions.
  subscribe: (urls, reqTimeout) ->
    sid = "uuid:#{gen_uuid()}"
    (@subs?={})[sid] = new Subscription sid, urls, @
    timeout = @subs[sid].selfDestruct reqTimeout
    { sid, timeout: "Second-#{timeout}" }

  renew: (sid, reqTimeout) ->
    unless @subs[sid]?
      console.log "Got subscription renewal request but could not find device #{sid}."
      return null
    timeout = @subs[sid].selfDestruct reqTimeout
    { sid, timeout: "Second-#{timeout}" }

  unsubscribe: (sid) -> delete @subs[sid] if @subs[sid]?


  # For optional actions not (yet) implemented.
  optionalAction: (cb) -> cb null, @buildSoapError new SoapError 602


  # Service actions that only return a State Variable.
  getStateVar: (action, elName, cb) ->
    # Actions start with 'Get' followed by variable name.
    varName = /^(Get)?(\w+)$/.exec(action)[2]
    return @buildSoapError new SoapError(404) unless varName of @_stateVars
    (el={})[elName] = @stateVars[varName]
    cb null, @buildSoapResponse action, el


  # Notify all subscribers of updated state variables.
  notify: -> @subs[uuid].notify() for uuid of @subs


  # Build a SOAP response XML document.
  buildSoapResponse: (action, args) ->
    # Create an action element.
    (body={})["u:#{action}Response"] = _.objectToArray args,
      [ _attr: { 'xmlns:u': @makeType() } ]

    '<?xml version="1.0"?>' + xml [ 's:Envelope': [
      { _attr: {
        'xmlns:s': 'http://schemas.xmlsoap.org/soap/envelope/'
        's:encodingStyle': 'http://schemas.xmlsoap.org/soap/encoding/' } }
      { 's:Body': [ body ] }
    ] ]


  # Build a SOAP error XML document.
  buildSoapError: (error) ->
    '<?xml version="1.0"?>' + xml [ 's:Envelope': _.objectToArray(
      _attr:
        'xmlns:s': 'http://schemas.xmlsoap.org/soap/envelope/'
        's:encodingStyle': 'http://schemas.xmlsoap.org/soap/encoding/'
      's:Body': [
        's:Fault': _.objectToArray(
          faultcode: 's:Client'
          faultstring: 'UPnPError'
          detail: [ 'UPnPError': _.objectToArray(
            _attr: 'xmlns:e': @makeNS 'control'
            errorCode: error.code
            errorDescription: error.message ) ]
        ) ]
    ) ]


  # Build an event notification XML document.
  buildEvent: (vars) ->
    '<?xml version="1.0"?>' + xml [ 'e:propertyset': [
      { _attr: 'xmlns:e': @makeNS 'event' }
      { 'e:property': _.objectToArray vars }
    ] ]


  # Send HTTP request with event info to `urls`.
  postEvent: (urls, sid, eventKey, data) ->
    for eventUrl in urls
      u = url.parse eventUrl
      headers =
        nt: 'upnp:event'
        nts: 'upnp:propchange'
        sid: sid
        seq: eventKey.toString()
        'content-length': Buffer.byteLength data
        'content-type': null
      options =
        host: u.hostname
        port: u.port
        method: 'NOTIFY'
        path: u.pathname
        headers: @device.makeHeaders headers
        agent: false
      req = http.request options
      req.on 'error', (err) ->
        console.log "#{eventUrl} - #{err.message}"
      req.write data
      req.end()


  # Build `service` element.
  buildServiceElement: ->
    [ { serviceType: @makeType() }
      { eventSubURL: "/service/#{@type}/event" }
      { controlURL: "/service/#{@type}/control" }
      { SCPDURL: "/service/#{@type}/description" }
      { serviceId: "urn:upnp-org:serviceId:#{@type}" } ]


  # Handle service related HTTP requests.
  requestHandler: (args, cb) ->
    { action, req } = args
    { method } = req
    
    switch action
      when 'description'
        # Service descriptions are static files.
        cb null, fs.readFileSync("#{@serviceDescription}", 'utf8')

      when 'control'
        serviceAction = /:\d#(\w+)"$/.exec(req.headers.soapaction)?[1]
        # Service control messages are `POST` requests.
        return cb new HttpError 405 if method isnt 'POST' or not serviceAction?
        data = ''
        req.on 'data', (chunk) -> data += chunk
        req.on 'end', =>
          @action serviceAction, data, (err, soapResponse) ->
            cb err, soapResponse, ext: null

      when 'event'
        {sid, timeout, callback: urls} = req.headers
        if method is 'SUBSCRIBE'
          if urls?
            # New subscription.
            if /<http/.test urls
              resp = @subscribe urls.slice(1, -1), timeout
            else
              err = new HttpError(412)
          else if sid?
            # `sid` is subscription ID, so this is a renewal request.
            resp = @renew sid, timeout
          else
            err = new HttpError 400
          err ?= new HttpError(412) unless resp?
          cb err, null, resp

        else if method is 'UNSUBSCRIBE'
          @unsubscribe sid if sid?
          # Unsubscription response is simply `200 OK`.
          cb (if sid? then null else new HttpError 412)

        else
          cb new HttpError 405

      else
        cb new HttpError 404


class Subscription
  constructor: (@uuid, urls, @service) ->
    @eventKey = 0
    @minTimeout = 1800
    @urls = urls.split ','
    @notify()

  selfDestruct: (timeout) ->
    clearTimeout(@destructionTimer) if @destructionTimer?
    # `timeout` is like `Second-(seconds|infinite)`.
    time = /Second-(infinite|\d+)/.exec(timeout)[1]
    if time is 'infinite' or parseInt(time) > @minTimeout
      time = @minTimeout
    else
      time = parseInt(time)
    @destructionTimer = setTimeout(
      => @service.unsubscribe @uuid
      time * 1000)
    # Return actual time until unsubscription.
    time

  notify: ->
    # Specification states that all variables are sent out to all clients
    # even if only one variable changed.
    eventedVars = {}
    for key, val of @service._stateVars when val.evented
      eventedVars[key] = @service.stateVars[key]
    eventXML = @service.buildEvent eventedVars
    @service.postEvent @urls, @uuid, @eventKey, eventXML
    @eventKey++


module.exports = Service
