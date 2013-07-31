
/**
 * Module dependencies.
 */

var util = require('./util');
var Artist = require('./schemas').metadata['spotify.metadata.proto.Artist'];
var debug = require('debug')('spotify-web:artist');

/**
 * Module exports.
 */

exports = module.exports = Artist;

/**
 * Artist URI getter.
 */

Object.defineProperty(Artist.prototype, 'uri', {
  get: function () {
    return util.gid2uri('artist', this.gid);
  },
  enumerable: true,
  configurable: true
});

/**
 * Loads all the metadata for this Artist instance. Useful for when you get an only
 * partially filled Artist instance from an Album instance for example.
 *
 * @param {Function} fn callback function
 * @api public
 */

Artist.prototype.get =
Artist.prototype.metadata = function (fn) {
  if (this._loaded) {
    // already been loaded...
    debug('artist already loaded');
    return process.nextTick(fn.bind(null, null, this));
  }
  var spotify = this._spotify;
  var self = this;
  spotify.get(this.uri, function (err, artist) {
    if (err) return fn(err);
    // extend this Artist instance with the new one's properties
    Object.keys(artist).forEach(function (key) {
      if (!self.hasOwnProperty(key)) {
        self[key] = artist[key];
      }
    });
    fn(null, self);
  });
};
