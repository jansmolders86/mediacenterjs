var express = require('express')
, app = express()
, fs = require('fs')
, upnp = require('upnp-device')
, mediaServer = upnp.createDevice('MediaServer', 'MediacenterJS');

var configfile = []
, configfilepath = './configuration/setup.js'
, configfile = fs.readFileSync(configfilepath)
, configfileResults = JSON.parse(configfile);


console.log('UPNP starting up')

mediaServer.on('ready', function() {
	console.log('UPNP server ready')
    mediaServer.addMedia(0, media, function(err, id) {
		if(!err){
			console.log("Added new media with ID:" + id);
		}else {
			console.log('error fetching media', err)
		}
    });
    mediaServer.ssdpAnnounce();
});

mediaServer.on('error', function(err) {
	console.log('error starting upnp server', err)
});
