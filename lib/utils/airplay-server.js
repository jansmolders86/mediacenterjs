/*
	MediaCenterJS - A NodeJS based mediacenter solution
	
    Copyright (C) 2014 - Jan Smolders

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
var mdns = require('mdns');
var express = require('express');
var getmac = require('getmac');
var http = require('http');
var bplist = require('bplist-parser');
var typeis = require('type-is');
var fs = require('fs');
var app = express();

exports.callbacks = {
	video : function (port, url, position) {}
};

exports.server = function(port, macAddress, options) {
  var server = http.createServer(app);
  var advertisment;
  var txtrec = { deviceid:macAddress,
  				// features: "0x1FFF",
  				 features: "0x5A7FFFF7,0xE",
  				 model: "MediaCenterJS0,0",
              	 srcvers: "150.33" };
  for (i in options.txtRecord) {
  	txtrec[i] = options.txtRecord[i];
  }
  server.on('listening', function () {
  	advertisment = mdns.createAdvertisement(mdns.tcp('airplay'), port, {name: options.name || "MediaCenterJS", txtRecord: txtrec});
  	advertisment.start();
  	var raoprec = { et: "0,3,5",
  					cn: "1,2,3",
  					da: "true",
  					sf: "0x4",
  					tp: "UDP",
  					vv: "1",
  					pw: "false",
  					am: "AppleTV3,2",
  					txtvers: "1",
  					vn: "65537",
  					md: "0,1,2",
  					vs: "150.33",
  					sv: "false",
  					ch: "2",
  					sr: "44100",
  					rhd:"5.0.6",
  					ss: "16" };
  	raopad = mdns.createAdvertisement(mdns.tcp('raop'), port, {name: macAddress.replace(/:/g, "").toUpperCase() + "@" + options.name || "MediaCenterJS",  txtRecord: raoprec});
  	raopad.start();
  });
  
  server.listen(port);

  return { stop: function() {
  	advertisment.stop();
  	raopad.stop();
  	server.close();
  }};
}
app.use(function(req, res, next) {
	if (!typeis(req, "application/x-apple-binary-plist")) {
		next();
	} else {
		var rawBody = [];
		req.on('data', function (chunk) {
			rawBody.push(chunk);
		});
		req.on('end', function () {
			var buf = Buffer.concat(rawBody);
			req.rawBody = buf.toString();
			req.body = bplist.parseBuffer(buf)[0];
			next();
		});
	}
});
app.all('*', function (req, res, next) {
	console.log(req.url);
	console.log(req.rawBody);
	next();
})

app.get('/server-info', function(req, res) {
    console.log(req.socket.localPort);
    res.set('Content-Type', 'text/x-apple-plist+xml');
    var features = "61647880183";
	//var features = "8191";    
    res.send('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>deviceid</key><string>B8:E8:56:30:B9:84</string><key>features</key><integer>'+features+'</integer><key>model</key><string>MediaCenterJS0,0</string><key>protovers</key><string>1.0</string><key>srcvers</key><string>150.33</string></dict></plist>');
});

app.get('/reverse', function (req, res) {
    console.log('reverse req');
})
app.post('/play', function (req, res) {
    var contentType = req.headers["content-type"] || req.headers["Content-Type"];
    console.log(contentType);
    //exports.callbacks.play(req.socket.localPort, );
})

