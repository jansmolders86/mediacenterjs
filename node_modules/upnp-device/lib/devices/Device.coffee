# Properties and functionality common for all devices,
# as specified in [UPnP Device Architecture 1.0] [1].
#
# [1]: http://upnp.org/sdcps-and-certification/standards/device-architecture-documents/

"use strict"

dgram = require 'dgram'
fs = require 'fs'
http = require 'http'
os = require 'os'
makeUuid = require 'node-uuid'
xml = require 'xml'

{ HttpError } = require '../errors'
_ = require '../utils'

# `Device` extends [`DeviceControlProtocol`](DeviceControlProtocol.html) with
# properties and methods common to devices and services.
DeviceControlProtocol = require '../DeviceControlProtocol'

class Device extends DeviceControlProtocol

  constructor: (@name, address) ->
    super
    @address = address if address?
    # Socket for listening and sending messages on SSDP broadcast address.
    @broadcastSocket = dgram.createSocket 'udp4', @ssdpListener
    @init()


  # SSDP configuration.
  ssdp:
    address: '239.255.255.250' # Address and port for broadcast messages.
    port: 1900
    timeout: 1800
    ttl: 4


  # Asynchronous operations to get and set some device properties.
  init: (cb) ->
    _.async.parallel
      address: (cb) => if @address? then cb null, @address else @getNetworkIP cb
      uuid: (cb) => @getUuid cb
      port: (cb) =>
        @httpServer = http.createServer(@httpListener)
        @httpServer.listen (err) -> cb err, @address().port
      (err, res) =>
        return @emit 'error', err if err?
        @uuid = "uuid:#{res.uuid}"
        @address = res.address
        @httpPort = res.port
        @broadcastSocket.bind @ssdp.port,'0.0.0.0', =>
          @broadcastSocket.addMembership @ssdp.address
          @broadcastSocket.setMulticastTTL @ssdp.ttl
          @addServices()
          @ssdpAnnounce()
          console.log "Web server listening on http://#{@address}:#{@httpPort}"
          @emit 'ready'


  # When HTTP and SSDP servers are started, we add and initialize services.
  addServices: ->
    @services = {}
    for serviceType in @serviceTypes
      @services[serviceType] = new @serviceReferences[serviceType] @


  # Generate HTTP headers from `customHeaders` object.
  makeSsdpMessage: (reqType, customHeaders) ->
    # These headers are included in all SSDP messages. Setting their value
    # to `null` makes `makeHeaders()` add default values.
    for header in [ 'cache-control', 'server', 'usn', 'location' ]
      customHeaders[header] = null
    headers = @makeHeaders customHeaders

    # First line of message string.
    # We build the string as an array first for `join()` convenience.
    message =
      if reqType is 'ok'
        [ "HTTP/1.1 200 OK" ]
      else
        [ "#{reqType.toUpperCase()} * HTTP/1.1" ]

    # Add header key/value pairs.
    message.push "#{h.toUpperCase()}: #{v}" for h, v of headers

    # Add carriage returns and newlines as specified by HTTP.
    message.push '\r\n'
    new Buffer message.join '\r\n'


  # Generate an object with HTTP headers for HTTP and SSDP messages.
  # Adds defaults and uppercases headers.
  makeHeaders: (customHeaders) ->
    # If key exists in `customHeaders` but is `null`, use these defaults.
    defaultHeaders =
      'cache-control': "max-age=#{@ssdp.timeout}"
      'content-type': 'text/xml; charset="utf-8"'
      ext: ''
      host: "#{@ssdp.address}:#{@ssdp.port}"
      location: @makeUrl '/device/description'
      server: [
        "#{os.type()}/#{os.release()}"
        "UPnP/#{@upnp.version.join('.')}"
        "#{@name}/1.0" ].join ' '
      usn: @uuid +
        if @uuid is (customHeaders.nt or customHeaders.st) then ''
        else '::' + (customHeaders.nt or customHeaders.st)

    headers = {}
    for header of customHeaders
      headers[header.toUpperCase()] = customHeaders[header] or defaultHeaders[header.toLowerCase()]
    headers


  # Make `nt` header values. 3 with device info, plus 1 per service.
  makeNotificationTypes: ->
    [ 'upnp:rootdevice', @uuid, @makeType() ]
      .concat(@makeType.call service for name, service of @services)


  # Parse SSDP headers using the HTTP module parser.
  parseRequest: (msg, rinfo, cb) ->
    # `http.parsers` is not documented and not guaranteed to be stable.
    parser = http.parsers.alloc()
    parser.reinitialize 'request'
    parser.socket = {}
    parser.onIncoming = (req) ->
      http.parsers.free parser
      { method, headers: { mx, st, nt, nts, usn } } = req
      { address, port } = rinfo
      cb null, { method, mx, st, nt, nts, usn, address, port }
    parser.execute msg, 0, msg.length


  # Attempt UUID persistance of devices across restarts.
  getUuid: (cb) ->
    uuidFile = "#{__dirname}/../../upnp-uuid"
    fs.readFile uuidFile, 'utf8', (err, file) =>
      data = try JSON.parse file; catch e then {}
      uuid = data[@type]?[@name]
      unless uuid?
        (data[@type]?={})[@name] = uuid = makeUuid()
        fs.writeFile uuidFile, JSON.stringify data
      # Always call back with UUID, existing or new.
      cb null, uuid


  # Guesses the server's internal network IP to send out URL in SSDP messages.
  getNetworkIP: (cb) ->
    interfaces = os.networkInterfaces() or ''
    ip = null
    isLocal = (address) -> /(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i.test address
    ((ip = config.address) for config in info when config.family == 'IPv4' and !isLocal config.address) for name, info of interfaces
    err = if ip? then null else new Error "IP address could not be retrieved."
    cb err, ip


  # Build device description XML document.
  buildDescription: ->
    '<?xml version="1.0"?>' + xml [ { root: [
      { _attr: { xmlns: @makeNS() } }
      { specVersion: [ { major: @upnp.version[0] }
                       { minor: @upnp.version[1] } ] }
      { device: [
        { deviceType: @makeType() }
        { friendlyName: "#{@name} @ #{os.hostname()}".substr(0, 64) }
        { manufacturer: 'UPnP Device for Node.js' }
        { modelName: @name.substr(0, 32) }
        { UDN: @uuid }
        { serviceList:
          { service: service.buildServiceElement() } for name, service of @services
        } ] }
    ] } ]


  # HTTP request listener
  httpListener: (req, res) =>
    # console.log "#{req.url} requested by #{req.headers['user-agent']} at #{req.client.remoteAddress}."

    # HTTP request handler.
    handler = (req, cb) =>
      # URLs are like `/device|service/action/[serviceType]`.
      [category, serviceType, action, id] = req.url.split('/')[1..]

      switch category
        when 'device'
          cb null, @buildDescription()
        when 'service'
          @services[serviceType].requestHandler { action, req, id }, cb
        else
          cb new HttpError 404

    handler req, (err, data, headers) =>
      if err?
        # See UDA for error details.
        console.log "Responded with #{err.code}: #{err.message} for #{req.url}."
        res.writeHead err.code, 'Content-Type': 'text/plain'
        res.write "#{err.code} - #{err.message}"

      else
        # Make a header object for response.
        # `null` means use `makeHeaders` function's default value.
        headers ?= {}
        headers['server'] ?= null
        if data?
          headers['Content-Type'] ?= null
          headers['Content-Length'] ?= Buffer.byteLength(data)

        res.writeHead 200, @makeHeaders headers
        res.write data if data?

      res.end()


  # Reuse broadcast socket for messages.
  ssdpBroadcast: (type) ->
    messages = for nt in @makeNotificationTypes()
      @makeSsdpMessage('notify', nt: nt, nts: "ssdp:#{type}", host: null)

    _.async.forEach messages,
      (msg, cb) => @broadcastSocket.send msg, 0, msg.length, @ssdp.port, @ssdp.address, cb
      (err) -> console.log err if err?


  # UDP message queue (to avoid opening too many file descriptors).
  ssdpSend: (messages, address, port) ->
    @ssdpMessages.push { messages, address, port }

  ssdpMessages: _.async.queue (task, queueCb) ->
    { messages, address, port } = task
    socket = dgram.createSocket 'udp4'
    socket.bind()
    _.async.forEach messages,
      (msg, cb) -> socket.send msg, 0, msg.length, port, address, cb
      (err) ->
        console.log err if err?
        socket.close()
        queueCb()
  , 5 # Max concurrent sockets


  # Listen for SSDP searches.
  ssdpListener: (msg, rinfo) =>
    # Wait between 0 and maxWait seconds before answering to avoid flooding
    # control points.
    answer = (address, port) =>
      @ssdpSend(@makeSsdpMessage('ok',
          st: st, ext: null
        ) for st in @makeNotificationTypes()
        address
        port)

    answerAfter = (maxWait, address, port) ->
      wait = Math.floor Math.random() * (parseInt(maxWait)) * 1000
      # console.log "Replying to search request from #{address}:#{port} in #{wait}ms."
      setTimeout answer, wait, address, port

    respondTo = [ 'ssdp:all', 'upnp:rootdevice', @makeType(), @uuid ]
    @parseRequest msg, rinfo, (err, req) ->
      if req.method is 'M-SEARCH' and req.st in respondTo
        answerAfter req.mx, req.address, req.port


  # Notify the network about the device.
  ssdpAnnounce: ->
    # To "kill" any instances that haven't timed out on control points yet,
    # first send `byebye` message.
    @ssdpBroadcast 'byebye'
    @ssdpBroadcast 'alive'

    # Keep advertising the device at a random interval less than half of
    # SSDP timeout, as per spec.
    makeTimeout = => Math.floor Math.random() * ((@ssdp.timeout / 2) * 1000)
    announce = =>
      setTimeout =>
        @ssdpBroadcast('alive')
        announce()
      , makeTimeout()
    announce()
    
    
module.exports = Device
