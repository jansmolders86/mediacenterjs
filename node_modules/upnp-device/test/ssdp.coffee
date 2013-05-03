assert = require 'assert'
dgram = require 'dgram'
upnp = require '../index'

exports['Send out SSDP notifications'] = (test) ->
  socket = dgram.createSocket 'udp4'
  
  # Listen on SSDP broadcast address
  socket.bind 1900, '0.0.0.0', ->
    socket.addMembership '239.255.255.250'
    socket.setMulticastTTL 4
    device = upnp.createDevice 'MediaServer', 'Test Device'
    device.on 'ready', ->
      msgs = (3 + Object.keys(device.services).length) * 2
      socket.on 'message', (msg, rinfo) ->
        device.parseRequest msg, rinfo, (err, req) ->
          # Only care about messages from our device.
          return unless new RegExp("^#{device.uuid}").test req.usn
          test.equal req.method, 'NOTIFY'
          test.ok req.nts in ['ssdp:byebye','ssdp:alive']
          if msgs-- is 1
            socket.close()
            test.done()
