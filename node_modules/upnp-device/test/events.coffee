assert = require 'assert'
http = require 'http'
upnp = require '../index'

exports['Accept subscriptions'] = (test) ->

  # Listen for response to subscription request.
  srv = http.createServer (req, res) ->
    assert.equal 'NOTIFY', req.method
    assert.equal 'upnp:event', req.headers.nt
    test.done()
  srv.listen()

  device = upnp.createDevice('MediaServer', 'Test Device')
  device.on 'ready', ->
    opts =
      method: 'SUBSCRIBE'
      port: device.httpPort
      host: device.address
      path: '/service/ConnectionManager/event'
      headers:
        nt: 'upnp:event'
        callback: "<http://localhost:#{srv.address().port}>"
        timeout: 'Second-1800'

    # Send subscription request.
    req = http.request opts, (res) ->
      res.on 'close', (err) -> test.ifError err, "Server error - #{err.message}"
    req.on 'error', (err) -> test.ifError err, "Server error - #{err.message}"
    req.end()
