# UPnP Devices for Node.js

upnp-device lets you create [UPnP Devices][upnp-dcp] in Node.js. The goal is to have an easy to use API, rather than exposing all UPnP internals.

# Limitations

* 2 implemented device specification included: MediaServer:1 and BinaryLight:1
* MediaServer has only been tested with audio

# Install

`npm install upnp-device`

In case you want to use the built in media server you also need to install Redis, preferrably using your system package manager.

# Documentation


## Basic usage

```javascript
var upnp = require('upnp-device');

var mediaServer = upnp.createDevice('MediaServer', 'My Media Application');

mediaServer.on('ready', function() {
    mediaServer.addMedia(0, media, function(err, id) {
        console.log("Added new media with ID:" + id);
    });
    mediaServer.ssdpAnnounce();
});
```

For a real world usage example, look at [Bragi], a media server using node-upnp-device.

## API

### upnp.Device

#### Event: 'ready'

`function() { }`

Emitted when the server has been assigned an IP, the HTTP server has started and SSDP messaging has been initialized.

#### Event: 'error'

`function(err) { }`

### upnp.createMyDevice(device, name[, address])

Create an instance of your own device implementation. Check the examples on how to create your own devices and services.

* implementation - A implementation of a device specified by the [UPnP Forum][upnp-dcp]
* name - The name of the device as it shows up in the network.
* address - Optional IP address to bind server to. If the address is omitted an IPv4 address will guessed using the IP configuration

```
var myDevice = require('./MyDevice')

var device = upnp.createMyOwnDevice(myDevice, 'My Device');

device.on('ready', function() {
    device.ssdpAnnounce();
});
```

### upnp.createDevice(type, name[, address])

* type - A device specified by the [UPnP Forum][upnp-dcp].
* name - The name of the device as it shows up in the network.
* address - Optional IP address to bind server to. If the address is omitted an IPv4 address will guessed using the IP configuration

### device.addMedia(parentID, media[, callback])

Applies to MediaServer.

The metadata needs to be extracted by the client, either through user input or by reading for example ID3 tags.

* parentID - Parent container of media. 0 means root.
* properties - Object with class properties. Example below.
* [callback(err, id)] - Called when all media has been added to the database. Returns the ID of the top container added.

```
container = {
    'class': 'object.container.album.musicAlbum',
    'title': 'My album'
};
```

```
item = {
    'class': 'object.container.audioItem.musicTrack',
    'title': 'My song',
    'creator': 'An artist',
    'location': '/media/mp3/an_artist-my_song.mp3',
    'album': 'My album'
};
```

Other official UPnP classes and properties are defined in the [MediaServer specification][upnp-av].

The server only stores the media info for as long as it is running. It is the responsibility of the client to store media information across restarts if desired.


### device.removeMedia(id[, callback])

* id - ID of object to remove. If it has children, they will also be removed.
* [callback(err)]


# Development

upnp-device is written in [CoffeeScript](http://coffeescript.org).

Contributions and comments are welcome on GitHub or IRC (jacobrask@FreeNode).

## Acronyms

* **UDA**: [UPnP Device Architecture] [upnp-uda]
* **DCP**: [UPnP Device Control Protocol] [upnp-dcp]
* **DIDL**: Digital Item Declaration Language, XML dialect for describing media. To describe content in AV devices, UPnP uses DIDL-Lite, a subset of DIDL.
* **UPnP AV**: [UPnP Audio/Video] [upnp-av]


# See also

 * [UPnP.org][upnp]
 * [UPnP client](https://github.com/TooTallNate/node-upnp-client) by @TooTallNate
 * [Gammatron](https://github.com/mattijs/Gammatron) by @mattijs

[upnp]: http://upnp.org
[upnp-dcp]: http://upnp.org/sdcps-and-certification/standards/sdcps/
[upnp-uda]: http://upnp.org/sdcps-and-certification/standards/device-architecture-documents/
[upnp-av]: http://upnp.org/specs/av/av1/
[bragi]: https://github.com/jacobrask/bragi
