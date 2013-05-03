# UPnP Media Server.
# Adds static properties and public API methods. Also see [specification] [1].
#
# [1]: http://upnp.org/specs/av/av1/

"use strict"

_ = require '../utils'

# Extends generic [`Device`](Device.html) class.
Device = require './Device'

class MediaServer extends Device

  constructor: -> super

  serviceTypes: [ 'ConnectionManager', 'ContentDirectory' ]

  serviceReferences:
      ConnectionManager:   require '../services/ConnectionManager'
      ContentDirectory:    require '../services/ContentDirectory'

  type: 'MediaServer'
  version: 1

  addMedia: (parentID, media, cb = ->) ->
    unless _.isNumber parentID
      return cb new Error 'Invalid Parent ID'
    unless media.class? and media.title?
      return cb new Error 'Missing required object property.'
    @services.ContentDirectory.addMedia arguments...

  removeMedia: -> @services.ContentDirectory.removeContent arguments...


module.exports = MediaServer
