
/**
 * Module dependencies.
 */

var base62 = require('./base62');

/**
 * Converts a GID Buffer to an ID hex string.
 * Based off of Spotify.Utils.str2hex(), modified to work with Buffers.
 */

exports.gid2id = function (gid) {
  for (var b = '', c = 0, a = gid.length; c < a; ++c) {
    b += (gid[c] + 256).toString(16).slice(-2);
  }
  return b;
};

/**
 * ID -> URI
 */

exports.id2uri = function (uriType, v) {
  var id = base62.fromHex(v, 22);
  return 'spotify:' + uriType + ':' + id;
};

/**
 * URI -> ID
 *
 * >>> SpotifyUtil.uri2id('spotify:track:6tdp8sdXrXlPV6AZZN2PE8')
 * 'd49fcea60d1f450691669b67af3bda24'
 * >>> SpotifyUtil.uri2id('spotify:user:tootallnate:playlist:0Lt5S4hGarhtZmtz7BNTeX')
 * '192803a20370c0995f271891a32da6a3'
 */

exports.uri2id = function (uri) {
  var parts = uri.split(':');
  var s;
  if (parts.length > 3 && 'playlist' == parts[3]) {
    s = parts[4];
  } else {
    s = parts[2];
  }
  var v = base62.toHex(s);
  return v;
};

/**
 * GID -> URI
 */

exports.gid2uri = function (uriType, gid) {
  var id = exports.gid2id(gid);
  return exports.id2uri(uriType, id);
};

/**
 * Accepts a String URI, returns the "type" of URI.
 * i.e. one of "local", "playlist", "track", etc.
 */

exports.uriType = function (uri) {
  var parts = uri.split(':');
  var len = parts.length;
  if (len >= 3 && 'local' == parts[1]) {
    return 'local';
  } else if (len >= 5) {
    return parts[3];
  } else if (len >= 4 && 'starred' == parts[3]) {
    return 'playlist';
  } else if (len >= 3) {
    return parts[1];
  } else {
    throw new Error('could not determine "type" for URI: ' + uri);
  }
};
