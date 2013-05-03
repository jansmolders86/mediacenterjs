# Base class for Device and Service. Properties and functionality as
# specified in [UPnP Device Control Protocol] [1].
#
# [1]: http://upnp.org/index.php/sdcps-and-certification/standards/sdcps/

"use strict"

{EventEmitter} = require 'events'
url = require 'url'

class DeviceControlProtocol extends EventEmitter

  constructor: ->

  schema: { domain: 'schemas-upnp-org', version: [1,0] }
  upnp: { version: [1,0] }


  # Make namespace string for services, devices, events, etc.
  makeNS: (category, suffix = '') ->
    category ?= if @device? then 'service' else 'device'
    [ 'urn', @schema.domain,
      [ category, @schema.version[0], @schema.version[1] ].join '-'
    ].join(':') + suffix


  # Make device/service type string for descriptions and SSDP messages.
  makeType: ->
    [ 'urn'
      @schema.domain
      if @device? then 'service' else 'device'
      @type
      @version ? @device.version
    ].join ':'


  # URL generation.
  makeUrl: (pathname) ->
    url.format
      protocol: 'http'
      hostname: @address ? @device.address
      port: @httpPort ? @device.httpPort
      pathname: pathname


module.exports = DeviceControlProtocol
