
/**
 * Gets a `Playlist` instance based off of the given Spotify playlist URI.
 */

var Spotify = require('../');
var login = require('../login');

// determine the playlist URI to use, ensure it's a "playlist" URI
var uri = process.argv[2] || 'spotify:user:123156851:playlist:6OvyUNc4ELX0b6OOhxfjRt';
var type = Spotify.uriType(uri);
if ('playlist' != type) {
  throw new Error('Must pass a "playlist" URI, got ' + JSON.stringify(type));
}

// initiate the Spotify session
Spotify.login(login.username, login.password, function (err, spotify) {
  if (err) throw err;

  spotify.playlist(uri, function (err, playlist) {
    if (err) throw err;

    console.log(playlist.contents);

    spotify.disconnect();
  });
});
