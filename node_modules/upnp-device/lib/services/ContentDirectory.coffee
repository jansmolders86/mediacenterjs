# Implements [ContentDirectory:1] [1] service for [MediaServer] [2] devices.
#
# [1]: http://upnp.org/specs/av/av1/
# [2]: MediaServer.html

"use strict"

fs  = require 'fs'
mime = require 'mime'
redis = require 'redis'
xml = require 'xml'
mime.define 'audio/flac': ['flac']

{HttpError,SoapError} = require '../errors'
_ = require '../utils'

# Extends generic [`Service`](Service.html) class.
Service = require './Service'

class ContentDirectory extends Service

  constructor: ->
    @_stateVars =
      SystemUpdateID: { value: 0, evented: yes }
      ContainerUpdateIDs: { value: '', evented: yes }
      SearchCapabilities: { value: '', evented: yes }
      SortCapabilities: { value: '*', evented: no }

    super

    @startDb()


  # ## Static service properties.
  type: 'ContentDirectory'
  serviceDescription: __dirname + '/ContentDirectory.xml'

  # Optional actions not (yet) implemented.
  optionalActions: [ 'Search', 'CreateObject', 'DestroyObject', 'UpdateObject',
    'ImportResource', 'ExportResource', 'StopTransferResource', 'GetTransferProgress' ]

  # State variable actions and associated XML element names.
  stateActions:
    GetSearchCapabilities: 'SearchCaps'
    GetSortCapabilities: 'SortCaps'
    GetSystemUpdateID: 'Id'


  # Handle actions coming from `requestHandler`.
  actionHandler: (action, options, cb) ->
    return @optionalAction cb if action in @optionalActions
    return @getStateVar action, @stateActions[action], cb if action of @stateActions

    switch action
      when 'Browse'
        browseCallback = (err, resp) =>
          cb null, (if err? then @buildSoapError(err) else resp)

        switch options?.BrowseFlag
          when 'BrowseMetadata'
            @browseMetadata options, browseCallback
          when 'BrowseDirectChildren'
            @browseChildren options, browseCallback
          else
            browseCallback new SoapError 402
      else
        cb null, @buildSoapError new SoapError(401)


  # Initialize redis conneciton.
  startDb: ->
    # Should probably create a private redis process here instead.
    @redis = redis.createClient()
    @redis.on 'error', (err) -> console.log err if err?
    @redis.select 9
    @redis.flushdb()


  # Stores which Internet Content Types (mime-types) are currently
  # stored in the Content Directory.
  addContentType: (type) ->
    @contentTypes ?= []
    unless type in @contentTypes
      @contentTypes.push type
      @device.services.ConnectionManager.stateVars.SourceProtocolInfo = @getProtocols()


  # Build Protocol Info string, `protocol:network:contenttype:additional`.
  getProtocols: ->
    ("http-get:*:#{type}:*" for type in @contentTypes).join(',')


  browseChildren: (options, cb) ->
    id = parseInt(options.ObjectID or 0)
    start = parseInt(options.StartingIndex or 0)
    max = parseInt(options.RequestedCount or 0)
    sort = if _.isString options.SortCriteria then options.SortCriteria else null

    @fetchChildren id, sort, (err, objects) =>
      return cb err if err?
      # Limit matches. Should be done before fetch instead.
      end = if max is 0 then objects.length - 1 else start + max
      matches = objects[start..end]
      @getUpdateId id, (err, updateId) =>
        cb err, @buildSoapResponse 'Browse',
          NumberReturned: matches.length
          TotalMatches: objects.length
          Result: @buildDidl matches
          UpdateID: updateId


  browseMetadata: (options, cb) ->
    id = parseInt(options?.ObjectID or 0)
    @fetchObject id, (err, object) =>
      return cb err if err?
      @getUpdateId id, (err, updateId) =>
        cb err, @buildSoapResponse 'Browse',
          NumberReturned: 1
          TotalMatches: 1
          Result: @buildDidl [ object ]
          UpdateID: updateId

  # Exposed through the public API.
  addMedia: (parentID, media, cb) ->
    obj = _.clone media
    obj.type = /object\.(\w+)/.exec(obj.class)[1]
    @addContentType obj.contenttype if obj.contenttype
    @insertContent parentID, obj, cb


  # Add object to Redis data store.
  insertContent: (parentID, object, cb) ->
    # Increment and return Object ID.
    @redis.incr 'nextid', (err, id) =>
      # Add Object ID to parent containers's child set.
      @redis.sadd "#{parentID}:children", id
      # Increment each time container (or parent container) is modified.
      @redis.incr "#{if object.type is 'container' then id else parentID}:updateid"
      # Add ID's to item data structure and insert into data store.
      object.id = "#{id}"
      object.parentid = "#{parentID}"
      @redis.hmset "#{id}", object
      cb err, id


  # Remove object with `id` and all its children. Exposed through the public API.
  removeContent: (id, cb) ->
    remove = (id) =>
      # Remove from parent's children set.
      @redis.hget id, "parentid", (err, parentID) =>
        @redis.srem "#{parentID}:children", "#{id}"
      @redis.smembers "#{id}:children", (err, childIds) =>
        # If no children were found, it's only `id`.
        if err? or childIds.length is 0
          keys = [ id ]
        # Otherwise add related fields and recurse.
        else
          keys = childIds.concat [ id, "#{id}:children", "#{id}:updateid" ]
          remove childId for childId in childIds
        @redis.del keys
    remove id
    # Return value shouldn't matter to client, call back immediately.
    cb null


  # Get metadata of all direct children of object with @id.
  fetchChildren: (id, sortCriteria = '+upnp:track,+dc:title', cb) ->
    sortFields = []
    # `sortCriteria` is like `+dc:title,-upnp:artist` where - is descending.
    return cb new SoapError 709 unless /^(\+|-)\w+:\w+/.test sortCriteria
    for sort in sortCriteria.split(',')
      [ dir, sortField ] = /^(\+|-)\w+:(\w+)$/.exec(sort)[1...]
      s = name: sortField
      # Functions to prepare value for comparison.
      s['primer'] =
        if sortField in [ 'track', 'length' ]
          parseInt
        else if sortField in [ 'title', 'artist' ]
          (s) -> s.toLowerCase()
      s['reverse'] = true if dir is '-'
      sortFields.push s

    @redis.smembers "#{id}:children", (err, childIds) =>
      return cb new SoapError 501 if err?
      return cb new SoapError 701 unless childIds.length
      _.async.concat childIds,
        (cId, cb) => @redis.hgetall cId, cb
        (err, results) ->
          results = results.sort _.sortObject sortFields...
          cb err, results


  # Get metadata of object with @id.
  fetchObject: (id, cb) ->
    @redis.hgetall id, (err, object) ->
      return cb new SoapError 501 if err?
      return cb new SoapError 701 unless Object.keys(object).length > 0
      cb null, object


  # Update IDs lets control points know if the data has been updated since
  # the last request.
  getUpdateId: (id, cb) ->
    getId = (id, cb) =>
      @redis.get "#{id}:updateid", (err, updateId) ->
        return cb new SoapError 501 if err?
        cb null, updateId

    if id is 0
      return cb null, @stateVars.SystemUpdateID
    else
      @redis.exists "#{id}:updateid", (err, exists) =>
        # If this ID doesn't have an updateid key, get parent's updateid.
        if exists is 1
          getId id, cb
        else
          @redis.hget id, 'parentid', (err, parentId) =>
            getId parentId, cb


  # Handle HTTP request if it's a resource request, otherwise pass  to super.
  requestHandler: (args, cb) ->
    { action, id } = args
    return super(arguments...) unless action is 'resource'
    @fetchObject id, (err, object) =>
      return cb new HttpError 500 if err?
      cb2 = (err, data) ->
        return cb new HttpError 500 if err?
        cb null, data,
          'Content-Type': object.contenttype
          'Content-Length': object.filesize or Buffer.byteLength data
      if object.type is 'item'
        fs.readFile object.location, cb2
      else if object.class is 'object.container.album.musicAlbum'
        @buildM3u id, cb2
      else
        return cb new HttpError 404


  # Build a DIDL XML structure for items/containers in the MediaServer device.
  buildDidl: (data) ->
    # Build an array of elements contained in an object element.
    buildObject = (obj) =>
      el = []
      el.push {
        _attr:
          id: obj.id
          parentID: obj.parentid
          restricted: 'true'
      }
      addProps = (el, obj, props) ->
        for prop in props
          key = prop.split(':')[1]
          if key of obj
            o = {}
            o[prop] = obj[key]
            el.push o

      addProps el, obj, [ 'dc:title', 'upnp:class', 'dc:creator', 'upnp:artist',
                          'upnp:genre', 'upnp:album', 'dc:date' ]

      if obj.location? and obj.contenttype?
        attrs = protocolInfo: "http-get:*:#{obj.contenttype}:*"
        attrs['size'] = obj.filesize if obj.filesize?
        el.push 'res': [ { _attr: attrs }, obj.location ]
      el

    ((body={})['DIDL-Lite']=[]).push
      _attr:
        'xmlns': @makeNS 'metadata', '/DIDL-Lite/'
        'xmlns:dc': 'http://purl.org/dc/elements/1.1/'
        'xmlns:upnp': @makeNS 'metadata', '/upnp/'
    for object in data
      type = /object\.(\w+)/.exec(object.class)[1]
      o = {}
      o[type] = buildObject object
      body['DIDL-Lite'].push o

    xml [ body ]


  # Build m3u file with URLs to resources for all children of `id`.
  buildM3u: (id, cb) ->
    @redis.smembers "#{id}:children", (err, childIDs) =>
      m3u = for childID in childIDs
        @makeUrl "/service/#{@type}/resource/#{childID}"
      cb null, m3u.join '\n'



module.exports = ContentDirectory
