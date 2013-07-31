
/**
 * Module dependencies.
 */

var inherits = require('util').inherits;

/**
 * Error "domains".
 */

var domains = {
  11: 'AuthorizationError',
  12: 'TrackError',
  13: 'HermesError',
  14: 'HermesServiceError'
};

/**
 * Error "codes".
 */

var codes = {
  0: 'Account subscription status not Spotify Premium',
  1: 'Failed to send to backend',
  8: 'Rate limited',
  408: 'Timeout',
  429: 'Too many requests'
};

/**
 * Module exports.
 */

module.exports = SpotifyError;

/**
 * Spotify error class.
 *
 * Sample `err` objects:
 *
 *   [ 11, 1, 'Invalid user' ]
 *   [ 12, 8, '' ]
 *   [ 14, 408, '' ]
 *   [ 14, 429, '' ]
 */

function SpotifyError (err) {
  this.domain = err[0] || 0;
  this.code = err[1] || 0;
  this.description = err[2] || '';
  this.data = err[3] || null;

  // Error impl
  this.name = domains[this.domain];
  var msg = codes[this.code];
  if (this.description) msg += ' (' + this.description + ')';
  this.message = msg;
  Error.captureStackTrace(this, SpotifyError);
}
inherits(SpotifyError, Error);
