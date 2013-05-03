var upnp = require('upnp-device');
var mediaServer = upnp.createDevice('MediaServer', 'MediacenterJS');

console.log('Upnp server status:', mediaServer)
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