assert = require 'assert'
http = require 'http'
{ Parser: XmlParser } = require 'xml2js'

upnp = require '../index'
_ = require '../lib/utils'

exports['Start an HTTP server'] = (test) ->
  deviceName = 'Foo'
  device = upnp.createDevice 'MediaServer', deviceName
  device.on 'ready', ->
    test.ok _.isString(device.address), "address should be a string"
    test.ok _.isNumber(device.httpPort), 'httpPort should be a number'
    http.get host: device.address, port: device.httpPort, path: '/device/description', (res) ->
      test.equal res.statusCode, 200, "Device description should respond with HTTP 200 OK"
      data = ''
      res.on 'data', (chunk) -> data += chunk
      res.on 'close', (err) -> test.ifError err, "Server error - #{err.message}"
      res.on 'end', -> (new XmlParser).parseString data, (err, data) ->
        test.ifError err, "Invalid XML in device description"
        dataDevice = data.root.device[0]
        test.equal deviceName, dataDevice.modelName[0], "modelName should equal name passed to createDevice function"
        dataService = dataDevice.serviceList[0].service
        test.equal Object.keys(device.services).length, dataService.length, "All device's services should be listed in description."
        for service in dataService
          [serviceType] = /urn:schemas-upnp-org:service:(\w+):(\d)/.exec(service.serviceType)[1..]
          test.ok serviceType in Object.keys device.services
        http.get {
          host: device.address
          port: device.httpPort
          path: dataService[0].SCPDURL },
          (res, err) ->
            test.equal res.statusCode, 200, "Service description should respond with HTTP 200 OK"
            data = ''
            res.on 'data', (chunk) -> data += chunk
            res.on 'close', (err) -> test.ifError err, "Server error - #{err.message}"
            res.on 'end', -> (new XmlParser).parseString data, (err, data) ->
              test.ifError err, "Invalid XML in service description"
              test.done()
