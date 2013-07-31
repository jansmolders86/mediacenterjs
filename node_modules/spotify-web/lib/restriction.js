
/**
 * Module dependencies.
 */

var util = require('./util');
var Restriction = require('./schemas').metadata['spotify.metadata.proto.Restriction'];

/**
 * Module exports.
 */

exports = module.exports = Restriction;

/**
 * Allowed countries 2-letter code Array getter.
 */

Object.defineProperty(Restriction.prototype, 'allowed', {
  get: function () {
    if (!this.countriesAllowed) return [];
    return this.countriesAllowed.match(/[A-Z]{2}/g);
  },
  enumerable: true,
  configurable: true
});

/**
 * Forbidden countries 2-letter code Array getter.
 */

Object.defineProperty(Restriction.prototype, 'forbidden', {
  get: function () {
    if (!this.countriesForbidden) return [];
    return this.countriesForbidden.match(/[A-Z]{2}/g);
  },
  enumerable: true,
  configurable: true
});
