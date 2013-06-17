/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, browser:true, devel:true, indent:4, maxerr:50 */
/*global require:true, module:true, __dirname:true */
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var Http = require('http');
var Crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var Helper = require('../lib/helpers.js');
var base_url = 'api.trakt.tv';
var api = require('./api-actions.js');
var Url = require('url');



var Trakt = module.exports = function (options) {
	"use strict";
	this.config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config.json'), 'utf8'));
	if (options && options.api_key) {
		this.config.api_key = options.api_key;
	}
	if (!this.config.api_key) {
		throw new Error('No API key specified');
	}

	if (options) {
		this.setUser.call(this, options.username, options.password, options.pass_hash);
	}
};
Util.inherits(Trakt, EventEmitter);

Trakt.prototype.setUser = function (username, password, pass_hash) {
	"use strict";
	this.config.username = username;
	this.config.password = pass_hash ? password : password ? Crypto.createHash('sha1')
		.update(password)
		.digest('hex') : undefined;
};

// TODO: Split this beast up and implement some nifty events
Trakt.prototype.request = function (action, method, options, callback) {
	"use strict";

	if (!api[action]) {
		return callback(new Error('Invalid action: ' + action));
	}
	var opts = Helper.apiMethod(action, method);
	if (!opts) {
		return callback(new Error('Invalid method ' + method + ' for action ' + action));
	}

	if (opts.type === 'GET') {
		getRequest.call(this, action, opts, options, callback);
	} else if (opts.type === 'POST') {
		postRequest.call(this, action, opts, options, callback);
	}
};

var getRequest = function (action, opts, options, callback) {
	"use strict";
	var self = this;
	var url = getGetUrl.call(self, action, opts, 'json', options);
	if (!url) {
		return callback(new Error('Missing parameters'));
	}

	var request_options = Url.parse(url);
	if (self.config.username && self.config.password) {
		request_options.auth = self.config.username + ':' + self.config.password;
	}
	var req = Http.request(request_options, function (res) {
		res.setEncoding('utf8');
		var result = '';
		res.on('data', function (chunk) {
			result += chunk;
		})
			.on('end', function () {
			try {
				var json = JSON.parse(result);
			} catch(e) {
				self.emit('error', e)
				return callback(e)
			}
			if (res.statusCode !== 200) {
				var err = new Error('Trakt responded ' + res.statusCode + ' - ' + Http.STATUS_CODES[res.statusCode]);
				self.emit('error', err, json);
				return callback(err, json);
			}
			self.emit('data', json);
			return callback(null, json);
		})
			.on('error', function (err) {
			self.emit('error', err);
			return callback(err);
		});
	});
	req.setTimeout(self.config.timeout);
	req.end();
};

var postRequest = function (action, opts, options, callback) {
	"use strict";
	var self = this;
	if (!this.config.username || !this.config.password) {
		return callback(new Error('POST messages require username and password'));
	}

	var params = getPostParams(action, opts, options);
	if (!params) {
		return callback(new Error('Missing parameters'));
	}
	params.username = self.config.username;
	params.password = self.config.password;

	var data = JSON.stringify(params);

	var url = Url.parse(getPostUrl.call(self, action, opts));
	url.method = 'POST';
	url.headers = {
		'Content-Length': data.length
	};

	var req = Http.request(url, function (res) {
		var result = '';
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			result += chunk;
		})
		.on('end', function () {
			var json = JSON.parse(result);
			if (res.statusCode !== 200) {
				var err = new Error('Trakt responded ' + res.statusCode + ' - ' + Http.STATUS_CODES[res.statusCode]);
				self.emit('error', err, json);
				return callback(err, json);
			}
			self.emit('data', json);
			return callback(null, json);
		})
		.on('error', function (err) {
			self.emit('error', err);
			return callback(err);
		});
	});
	req.setTimeout(this.config.timeout);
	req.end(data);
};

/*
 * Url generating functions
 */
var getGetUrl = function (action, opts, format, options) {
	"use strict";
	var url = 'http://' + base_url + '/' + action + '/' + opts.method + '.' + format + '/' + this.config.api_key;

	var length = opts.parameters.length;

	for (var i = 0; i < length; i++) {
		var param = opts.parameters[i];
		if (options[param.name]) {
			if (typeof options[param.name] != 'string') options[param.name] = '' + options[param.name]
			url += '/' + options[param.name].replace(/ /g, '+');
		} else {
			if (!param.optional) {
				return undefined;
			} else {
				break;
			}
		}
	}
	return url.replace(' ', '+');
};

var getPostUrl = function (action, opts) {
	"use strict";
	return 'http://' + base_url + '/' + action + '/' + opts.method + '/' + this.config.api_key;
};

var getPostParams = function (action, opts, options) {
	"use strict";
	var result = {};
	var length = opts.parameters.length;

	for (var i = 0; i < length; i++) {
		var param = opts.parameters[i];
		if (options[param.name]) {
			result[param.name] = options[param.name];
		} else if (!param.optional) {
			return undefined;
		}
	}
	return result;
};
