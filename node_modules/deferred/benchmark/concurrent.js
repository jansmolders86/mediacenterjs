'use strict';

// Benchmark comparing performance of promise setups (concurrent)
// To run it, do following in package path:
//
// $ npm install Q jquery when
// $ node benchmark/concurrent.js

var generate   = require('es5-ext/lib/Array/generate')
  , forEach    = require('es5-ext/lib/Object/for-each')
  , pad        = require('es5-ext/lib/String/prototype/pad')
  , lstat      = require('fs').lstat
  , Q          = require('Q')
  , jqDeferred = require('jquery').Deferred
  , when       = require('when')
  , deferred   = require('../lib')

  , now = Date.now
  , Deferred = deferred.Deferred
  , promisify = deferred.promisify
  , nextTick  = process.nextTick

  , self, time, count = 10000, data = {}, next, tests, def = deferred()
  , files = generate(count, __filename);

console.log("Promise overhead (concurrent calls)", "x" + count + ":\n");

tests = [function () {
	var i = count, j = count;
	self = function () {
		lstat(__filename, function (err, stats) {
			var x;
			x = stats;
			if (err) {
				throw err;
			}
			if (!--i) {
				data["Base (plain Node.js lstat call)"] = now() - time;
				next();
			}
		});
	};
	time = now();
	while (j--) {
		self();
	}
}, function () {
	var i = count, j = count, dlstat;
	dlstat = function (path) {
		var def = new Deferred();
		lstat(path, function (err, stats) {
			def.resolve(err || stats);
		});
		return def.promise;
	};

	self = function () {
		dlstat(__filename).end(function () {
			if (!--i) {
				data["Deferred: Dedicated wrapper"] = now() - time;
				next();
			}
		});
	};
	time = now();
	while (j--) {
		self();
	}
}, function () {
	var i = count, j = count, dlstat = promisify(lstat);

	self = function () {
		dlstat(__filename).end(function () {
			if (!--i) {
				data["Deferred: Promisify (generic wrapper)"] = now() - time;
				next();
			}
		});
	};
	time = now();
	while (j--) {
		self();
	}
}, function () {
	var dlstat = promisify(lstat);

	time = now();
	deferred.map(files, function (name) {
		return dlstat(name);
	}).end(function () {
		data["Deferred: Map + Promisify"] = now() - time;
		next();
	});
}, function () {
	var i = count, j = count, dlstat;

	dlstat = function (path) {
		var def = Q.defer();
		lstat(path, function (err, stats) {
			if (err) {
				def.reject(err);
			} else {
				def.resolve(stats);
			}
		});
		return def.promise;
	};

	self = function () {
		dlstat(__filename).then(function () {
			if (!--i) {
				data["Q: Dedicated wrapper"] = now() - time;
				// Get out of try/catch clause
				nextTick(next);
			}
		}).end();
	};
	time = now();
	while (j--) {
		self();
	}
}, function () {
	var i = count, j = count, dlstat = Q.nbind(lstat, null);

	self = function () {
		dlstat(__filename).then(function () {
			if (!--i) {
				data["Q: nbind (generic wrapper)"] = now() - time;
				// Get out of try/catch clause
				nextTick(next);
			}
		}).end();
	};
	time = now();
	while (j--) {
		self();
	}
}, function () {
	var i = count, j = count, dlstat;

	dlstat = function (path) {
		var def = jqDeferred();
		lstat(path, function (err, stats) {
			if (err) {
				def.reject(err);
			} else {
				def.resolve(stats);
			}
		});
		return def;
	};

	self = function () {
		dlstat(__filename).done(function () {
			if (!--i) {
				data["jQuery.Deferred: Dedicated wrapper"] = now() - time;
				next();
			}
		}).fail(function (e) {
			throw e;
		});
	};
	time = now();
	while (j--) {
		self();
	}
}, function () {
	var i = count, j = count, dlstat;

	dlstat = function (path) {
		var def = when.defer();
		lstat(path, function (err, stats) {
			if (err) {
				def.reject(err);
			} else {
				def.resolve(stats);
			}
		});
		return def;
	};

	self = function () {
		dlstat(__filename).then(function () {
			if (!--i) {
				data["When: Dedicated wrapper"] = now() - time;
				nextTick(next);
			}
		}, function (e) {
			nextTick(function () {
				throw e;
			});
		});
	};

	time = now();
	while (j--) {
		self();
	}
}];

next = function () {
	if (tests.length) {
		tests.shift()();
	} else {
		def.resolve();
		forEach(data, function (value, name, obj, index) {
			console.log(index + 1 + ":",  pad.call(value, " ", 5) + "ms ", name);
		}, null, function (a, b) {
			return this[a] - this[b];
		});
	}
};

next();
