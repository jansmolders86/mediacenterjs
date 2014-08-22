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
var plist = require('plist');
var typeis = require('type-is');
var fs = require('fs');
var io = require('./setup-socket').io;

var SERVER_MODEL = "AppleTV3,2";

exports.server = function(port, macAddress, options, device) {
    var app = express();
    var server = http.createServer(app);

    app.use(bodyParser);
    app.all('*', urlLogger);
    app.get('/server-info', serverInfo);
    app.post('/play', function (req, res) {
        console.log(req.body);
        console.log("VID URL:", req.body.host + req.body.path);

        device.playMovie("http://" + req.body.host + req.body.path, {
            progression: req.body.startPosition || 0
        }, function() {
        	console.log("movie PLAYINH");
            res.status(200);
            res.set('Content-Length', '0');
            res.send();
        });
    });

    var advertisment;
    var txtrec = { deviceid : macAddress,
                   features : "0x100029ff",
                   model    : SERVER_MODEL,
                   vv       : "1",
                   srcvers  : "150.33" };
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
                        am: SERVER_MODEL,
                        txtvers: "1",
                        vn: "65537",
                        md: "0,1,2",
                        vs: "150.33",
                        sv: "false",
                        ch: "2",
                        sr: "44100",
                        rhd:"5.0.6",
                        ss: "16" };
        raopad = mdns.createAdvertisement(mdns.tcp('raop'), port, {name: macAddress.replace(/:/g, "").toUpperCase() + "@" + (options.name || "MediaCenterJS"),  txtRecord: raoprec});
        raopad.start();
    });

    server.listen(port);
    return { stop: function() {
                        advertisment.stop();
                        raopad.stop();
                        server.close();
                   }
           };
}

function parseTextParameters(rawBody) {
    var body = {};
    var lines = rawBody.split("\n");
    for (i in lines) {
        var kv = lines[i].split(":");
        body[kv[0].trim()] = kv[1].trim();
    }
    return body;
}

function bodyParser(req, res, next) {
    if (typeis(req, "application/x-apple-binary-plist")
    || typeis(req, "text/parameters")) {
        var rawBody = [];
        req.on('data', function (chunk) {
            rawBody.push(chunk);
        });
        req.on('end', function () {
            var buf = Buffer.concat(rawBody);
            req.rawBody = buf.toString();
            if (typeis(req, "application/x-apple-binary-plist")) {
                req.body = bplist.parseBuffer(buf)[0];
            } else {
                req.body = parseTextParameters(rawBody);
            }
            next();
        });
    } else {
    next();
  }
}

function urlLogger(req, res, next) {
    console.log(req.url);
    next();
}


function serverInfo(req, res) {
    res.set('Content-Type', 'text/x-apple-plist+xml');
    res.send(plist.build({
        deviceid: "B8:E8:56:30:B9:84",
        features: 268446207,
        model: SERVER_MODEL,
        protovers: "1.0",
        srcvers: "150.33"
    }));
}



