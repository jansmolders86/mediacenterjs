
/**
 * Prints out the HTTP uris for the different album cover sizes for the specified
 * Album.
 */

var Spotify = require('../');
var login = require('../login');

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
    console.log('Album Art URIs for "%s - %s"', album.artist[0].name, album.name);

    // print out the HTTP uris for each image size of the album covers
    album.cover.forEach(function (image) {
      console.log('%s: %s', image.size, image.uri);
    });

    spotify.disconnect();
  });
});
