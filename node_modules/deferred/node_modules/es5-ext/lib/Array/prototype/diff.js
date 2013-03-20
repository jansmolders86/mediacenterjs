'use strict';

var value    = require('../../Object/valid-value')
  , copy     = require('./copy')
  , contains = require('./contains')
  , remove   = require('./remove')

  , filter = Array.prototype.filter;

module.exports = function (other) {
	var r;
	if ((value(this).length >>> 0) > (value(other).length >>> 0)) {
		r = copy.call(this);
		remove.apply(r, other);
		return r;
	} else {
		return filter.call(this, function (item) {
			return !contains.call(other, item);
		});
	}
};
