'use strict';

var callable   = require('es5-ext/lib/Object/valid-callable')
  , d          = require('es5-ext/lib/Object/descriptor')
  , isCallable = require('es5-ext/lib/Object/is-callable')
  , ee         = require('event-emitter')
  , isPromise  = require('./is-promise')

  , create = Object.create, defineProperty = Object.defineProperty, deferred;

module.exports = exports = function (name, unres, onres, res) {
	name = String(name);
	callable(res) && ((onres == null) || callable(onres)) && callable(unres);
	defineProperty(exports._unresolved, name, d(unres));
	exports._onresolve[name] = onres;
	defineProperty(exports._resolved, name, d(res));
	exports._names.push(name);
};

exports._names = ['end', 'then', 'valueOf'];

exports._unresolved = ee(create(Function.prototype, {
	then: d(function (win, fail) {
		var def;
		if (!this.pending) {
			this.pending = [];
		}
		def = deferred();
		this.pending.push('then', [win, fail, def.resolve]);
		return def.promise;
	}),
	end: d(function (win, fail) {
		(win == null) || callable(win);
		(fail == null) || callable(fail);
		if (!this.pending) {
			this.pending = [];
		}
		this.pending.push('end', arguments);
	}),
	resolved: d(false),
	returnsPromise: d(true),
	valueOf: d(function () {
		return this;
	})
}));

exports._onresolve = {
	then: function (win, fail, resolve) {
		var value, cb = this.failed ? fail : win;
		if (cb == null) {
			resolve(this.value);
		} else if (isCallable(cb)) {
			if (isPromise(cb)) {
				if (cb.resolved) {
					resolve(cb.value);
				} else {
					cb.end(resolve, resolve);
				}
			} else {
				try {
					value = cb(this.value);
				} catch (e) {
					value = e;
				}
				resolve(value);
			}
		} else {
			resolve(cb);
		}
	},
	end: function (win, fail) {
		if (this.failed) {
			if (fail) {
				fail(this.value);
			} else {
				throw this.value;
			}
		} else if (win) {
			win(this.value);
		}
	}
};

exports._resolved = ee(create(Function.prototype, {
	then: d(function (win, fail) {
		var value, cb = this.failed ? fail : win;
		if (cb == null) {
			return this;
		} else if (isCallable(cb)) {
			if (isPromise(cb)) {
				return cb;
			}
			try {
				value = cb(this.value);
			} catch (e) {
				value = e;
			}
			return deferred(value);
		} else {
			return deferred(cb);
		}
	}),
	end: d(function (win, fail) {
		(win == null) || callable(win);
		(fail == null) || callable(fail);
		if (this.failed) {
			if (fail) {
				fail(this.value);
			} else {
				throw this.value;
			}
		} else if (win) {
			win(this.value);
		}
	}),
	resolved: d(true),
	returnsPromise: d(true),
	valueOf: d(function () {
		return this.value;
	})
}));

deferred = require('./deferred');
deferred.extend = exports;
