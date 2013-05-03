# UPnP Media Server.
# Adds static properties and public API methods. Also see [specification] [1].
#
# [1]: http://upnp.org/specs/av/av1/

"use strict"

# Extends generic [`Device`](Device.html) class.
UPNP = require '../index.js'

class MyDevice extends UPNP.Device

  constructor: -> super

  serviceTypes: [ 'MyService' ]

  serviceReferences:
      MyService: require './MyService'

  type: 'MyDevice'
  version: 1

module.exports = MyDevice
