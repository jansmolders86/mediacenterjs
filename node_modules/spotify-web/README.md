node-spotify-web
================
### NodeJS implementation of the Spotify Web protocol

This module implements the "Spotify Web" WebSocket protocol that is used on
Spotify's [Web UI](http://play.spotify.com).

This module is heavily inspired by the original open-source Python implementation:
[Hexxeh/spotify-websocket-api](https://github.com/Hexxeh/spotify-websocket-api)

Installation
------------

``` bash
$ npm install spotify-web
```


Example
-------

Here's an example of logging in to the Spotify server and creating a session. Then
requesting the metadata for a given track URI, and playing the track audio file
through the speakers:

``` javascript
var lame = require('lame');
var Speaker = require('speaker');
var Spotify = require('spotify-web');
var uri = process.argv[2] || 'spotify:track:6tdp8sdXrXlPV6AZZN2PE8';

// Spotify credentials...
var username = process.env.USERNAME;
var password = process.env.PASSWORD;

Spotify.login(username, password, function (err, spotify) {
  if (err) throw err;

  // first get a "Track" instance from the track URI
  spotify.get(uri, function (err, track) {
    if (err) throw err;
    console.log('Playing: %s - %s', track.artist[0].name, track.name);

    // play() returns a readable stream of MP3 audio data
    track.play()
      .pipe(new lame.Decoder())
      .pipe(new Speaker())
      .on('finish', function () {
        spotify.disconnect();
      });

  });
});
```

See the `example` directory for some more example code.


API
---

TODO: document!
