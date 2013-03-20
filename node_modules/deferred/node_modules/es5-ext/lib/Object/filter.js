'use strict';

var callable = require('./valid-callable')
  , forEach  = require('./for-each')

  , call = Function.prototype.call;

module.exports = function (obj, cb/*, thisArg*/) {
	var o = {}, thisArg = arguments[2];
	callable(cb);
	forEach(obj, function (value, key) {
		if (call.call(cb, thisArg, value, key)) {
			o[key] = obj[key];
		}
	});
	return o;
};
