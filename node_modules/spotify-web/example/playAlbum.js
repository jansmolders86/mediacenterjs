
/**
 * Example script that retrieves the specified Album through Spotify, then decodes
 * the MP3 data through node-lame, and finally plays the decoded PCM data through
 * the speakers using node-speaker.
 */

var Spotify = require('../');
var login = require('../login');
var lame = require('lame');
var Speaker = require('speaker');

// determine the URI to play, ensure it's an "album" URI
var uri = process.argv[2] || 'spotify:album:7u6zL7kqpgLPISZYXNTgYk';
var type = Spotify.uriType(uri);
if ('album' != type) {
  throw new Error('Must pass a "album" URI, got ' + JSON.stringify(type));
}

Spotify.login(login.username, login.password, function (err, spotify) {
  if (err) throw err;

  // first get a "Album" instance from the album URI
  spotify.get(uri, function (err, album) {
    if (err) throw err;

    // first get the Track instances for each disc
    var tracks = [];
    album.disc.forEach(function (disc) {
      if (!Array.isArray(disc.track)) return;
      tracks.push.apply(tracks, disc.track);
    });
    console.log(tracks.map(function(t){ return t.uri; }));

    function next () {
      var track = tracks.shift();
      if (!track) return spotify.disconnect();

      track.get(function (err) {
        if (err) throw err;
        console.log('Playing: %s - %s', track.artist[0].name, track.name);

        track.play()
          .on('error', function (err) {
            console.error(err.stack || err);
            next();
          })
          .pipe(new lame.Decoder())
          .pipe(new Speaker())
          .on('finish', next);
      });
    }
    next();

  });
});
