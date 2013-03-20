// Promise aware Array's reduce

'use strict';

var isError   = require('es5-ext/lib/Error/is-error')
  , extend    = require('es5-ext/lib/Object/extend')
  , value     = require('es5-ext/lib/Object/valid-value')
  , callable  = require('es5-ext/lib/Object/valid-callable')
  , deferred  = require('../../deferred')
  , isPromise = require('../../is-promise')

  , call = Function.prototype.call;

var Reduce = function (list, cb, initial, initialized) {
	this.list = list;
	this.cb = cb;
	this.initialized = initialized;
	this.length = list.length >>> 0;

	if (isPromise(initial)) {
		if (!initial.resolved) {
			extend(this, deferred());
			initial.end(function (initial) {
				this.value = initial;
				this.init();
			}.bind(this), this.resolve);
			return this.promise;
		}
		this.value = initial.value;
		if (isError(this.value)) {
			return initial;
		}
	} else {
		this.value = initial;
	}

	return this.init();
};

Reduce.prototype = {
	current: 0,
	init: function () {
		while (this.current < this.length) {
			if (this.current in this.list) {
				if (!this.promise) {
					extend(this, deferred());
				}
				this.processCb = this.processCb.bind(this);
				this.processValue = this.processValue.bind(this);
				this.process();
				return this.promise;
			}
			++this.current;
		}
		if (!this.initialized) {
			throw new Error("Reduce of empty array with no initial value");
		}
		return this.resolve ? this.resolve(this.value) : deferred(this.value);
	},
	process: function () {
		var value = this.list[this.current];
		if (isPromise(value)) {
			if (!value.resolved) {
				value.end(this.processCb, this.resolve);
				return;
			}
			value = value.value;
			if (isError(value)) {
				this.resolve(value);
				return;
			}
		} else if (isError(value) && !this.cb) {
			this.resolve(value);
			return;
		}
		this.processCb(value);
	},
	processCb: function (value) {
		if (!this.initialized) {
			this.initialized = true;
			this.processValue(value);
			return;
		}
		if (this.cb) {
			try {
				value = call.call(this.cb, undefined, this.value, value, this.current,
					this.list);
			} catch (e) {
				this.resolve(e);
				return;
			}
			if (isPromise(value)) {
				if (!value.resolved) {
					value.end(this.processValue, this.resolve);
					return;
				}
				value = value.value;
			}
			if (isError(value)) {
				this.resolve(value);
				return;
			}
		}
		this.processValue(value);
	},
	processValue: function (value) {
		this.value = value;
		while (++this.current < this.length) {
			if (this.current in this.list) {
				this.process();
				return;
			}
		}
		this.resolve(this.value);
	}
};

module.exports = function (cb/*, initial*/) {
	value(this);
	(cb == null) || callable(cb);

	return new Reduce(this, cb, arguments[1], arguments.length > 1);
};
