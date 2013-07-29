var safe = require('safe');
var tcoll = require('./tcoll.js');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var EventEmitter = require('events').EventEmitter

function tdb(path_, opts, gopts) {
	this._gopts = gopts;
	this._path = path.resolve(path_);	
	this._cols = {};
	this._name = opts.name || path.basename(path_);
}

tdb.prototype.__proto__ = EventEmitter.prototype;

module.exports = tdb;

tdb.prototype.open = function (options, cb) {
	// actually do nothing for now, we are inproc 
	// so nothing to open/close... collection will keep going on their own
	if (cb==null) cb = options;
	cb = cb || function () {};
	safe.back(cb,null,this)
}

tdb.prototype.close = function (forceClose, cb) {
	var self = this;
	if (cb==null) cb = forceClose;
	cb = cb || function () {};		
	// stop any further operations on current collections
	async.forEach(_.values(self._cols), function (c, cb) {
		c._stop(cb)
	}, safe.sure(cb, function () {
		// and clean list
		self._cols = {};
		safe.back(cb,null,this);
	}))
}

tdb.prototype.createIndex = function () {
	var c = this._cols[arguments[0]];
	var cb = arguments[arguments.length-1];
	if (!c) 
		return safe.back(cb, new Error("Collection doesn't exists"));
	var nargs = Array.prototype.slice.call(arguments,1,arguments.length-1);
	c.createIndex.apply(c, nargs);
}

tdb.prototype.collection = function (cname, opts, cb) {
	return this._collection(cname, opts,false, cb)
}

tdb.prototype.createCollection = function (cname, opts, cb) {
	return this._collection(cname, opts,true, cb)
}

tdb.prototype._nameCheck = function (cname) {
	var err = null;
	if (!_.isString(cname))
		err = new Error("collection name must be a String");
	if (!err && cname.length==0)
		err = new Error("collection names cannot be empty");
	if (!err && cname.indexOf("$")!=-1)
		err = new Error("collection names must not contain '$'");
	if (!err) { 
		var di = cname.indexOf(".");		
		if (di==0 || di==cname.length-1)
			err = new Error("collection names must not start or end with '.'");
	}
	if (!err && cname.indexOf("..")!=-1)		
		err = new Error("collection names cannot be empty");
	return err;
}

tdb.prototype._collection = function (cname, opts, create, cb) {
	var err = this._nameCheck(cname);
		
	if (cb==null) {
		cb = opts;
		opts = {};
	}
	cb = cb || function () {};
	if (err) 
		return safe.back(cb, err);
	var self = this;
	var c = self._cols[cname];
	if (c) {
		cb((opts.strict && create)?new Error("Collection test_strict_create_collection already exists. Currently in safe mode."):null, c);
		return c;
	} else if (!create && opts.strict) {
		return cb(new Error("Collection does-not-exist does not exist. Currently in safe mode."));
	}
	c = new tcoll();
	c.init(this, cname, opts, safe.sure(cb, function () {
		self._cols[cname] = c;
		cb(null, c);
	}))
	return c;
}

tdb.prototype.collectionNames = function (opts, cb) {
	var self = this;
	if (cb==null) {
		cb = opts;
		opts = {};
	}	
	fs.readdir(self._path, safe.sure(cb,function(files) {
		// some collections ca be on disk and some only in memory, we need both
		files = _.union(files,_.keys(self._cols))
		cb(null,_(files).map(function (e) { return opts.namesOnly?e:{name:self._name+"."+e};}).value())
	}))
}

tdb.prototype.collections = function (cb) {
	var self = this;
	self.collectionNames({namesOnly:1},safe.sure(cb, function (names) {
		async.forEach(names, function (cname, cb) {
			self.collection(cname, cb)
		},safe.sure(cb, function () {
			cb(null, _.values(self._cols))
		}))
	}))
}

tdb.prototype.dropCollection = function (cname, cb) {
	var self = this;
	var c = this._cols[cname];
	if (!c) {
		var err = new Error("ns not found");
		if (cb) return safe.back(cb, err)
			else throw new err;
	}
	c._stop(safe.sure(cb, function (ondisk) {
		delete self._cols[cname];		
		if (ondisk)
			fs.unlink(path.join(self._path,cname),safe.sure(cb, function () {
				cb(null, true)
			}))
		else
			cb(null,true);
	}))
}

tdb.prototype.dropDatabase = function (cb) {
	var self = this;
	self.collections(safe.sure(cb, function(collections) {
		async.forEach(collections, function (c, cb) {
			self.dropCollection(c.collectionName,cb)
		},cb)
	}))
}

tdb.prototype.renameCollection = function (on,nn,opts,cb) {
	if (cb==null) {
		cb = opts;
		opts = {};
	}		
	cb = cb || safe.noop;
	var old = this._cols[on];
	if (old)
		old.rename(nn, {}, cb)
	else
		safe.back(cb);
}
