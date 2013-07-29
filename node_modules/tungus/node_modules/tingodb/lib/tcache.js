var _ = require('lodash');
var BPlusTree = require('./bplustree');

function tcache (tdb, size) {
	this._tdb = tdb;
	this.size = size || 1000;
	this._cache = [];
	this._cache.length = this.size;
	for (var i=0; i<this._cache.length; i++) {
		this._cache[i]={k:null};
	}
}

tcache.prototype.set = function (k,v) {
	this._cache[k%this.size] = {k:k,v:this.cloneDeep(v)};
}

tcache.prototype.unset = function (k) {
	var c = this._cache[k%this.size];
	if (c.k==k)
		this._cache[k%this.size]={k:null}
}

tcache.prototype.get = function (k) {
	var c = this._cache[k%this.size];
	return c.k == k ? this.cloneDeep(c.v) : null;
}

tcache.prototype.cloneDeep = function (obj) {
	var self = this;
	return _.cloneDeep(obj, function (c) {
		if (c instanceof self._tdb.ObjectID) {
			var oid = new c.constructor(c.$oid);
			if (!oid.$oid) oid.$oid = oid.toJSON();
			return oid;
		}
		if (c instanceof self._tdb.Binary)
			return new c.constructor(new Buffer(c.value(true)));
	});
};

module.exports = tcache;
