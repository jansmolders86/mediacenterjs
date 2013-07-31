
/**
 * Module dependencies.
 */

var util = require('./util');
var Album = require('./schemas').metadata['spotify.metadata.proto.Album'];
var debug = require('debug')('spotify-web:album');

/**
 * Module exports.
 */

exports = module.exports = Album;

/**
 * Album URI getter.
 */

Object.defineProperty(Album.prototype, 'uri', {
  get: function () {
    return util.gid2uri('album', this.gid);
  },
  enumerable: true,
  configurable: true
});

/**
 * Loads all the metadata for this Album instance. Useful for when you get an only
 * partially filled Album instance from an Album instance for example.
 *
 * @param {Function} fn callback function
 * @api public
 */

Album.prototype.get =
Album.prototype.metadata = function (fn) {
  if (this._loaded) {
    // already been loaded...
    debug('album already loaded');
    return process.nextTick(fn.bind(null, null, this));
  }
  var spotify = this._spotify;
  var self = this;
  spotify.get(this.uri, function (err, album) {
    if (err) return fn(err);
    // extend this Album instance with the new one's properties
    Object.keys(album).forEach(function (key) {
      if (!self.hasOwnProperty(key)) {
        self[key] = album[key];
      }
    });
    fn(null, self);
  });
};
