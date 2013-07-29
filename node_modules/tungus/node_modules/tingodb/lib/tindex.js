var _ = require('lodash');
var BPlusTree = require('./bplustree');

function tindex (key,tcoll,options,name) {
	options = options || {};
	this.name = name || key+'_';
	this._unique = options.unique || false;
	this._c = tcoll;
	this._bp = BPlusTree.create({order:100});
	this._nuls = {};
	this._array = options._tiarr || false;
	this._key = key;
	var getter = new tcoll._tdb.Finder.field(key);
	eval("this._get = function (obj) { return "+ (this._array?getter.native3():getter.native()) + " }");
}

tindex.prototype.set = function (k_,v, check) {
	var self = this;
	var k = this._get(k_);
	if (check) {
		if (this._unique && this._bp.get(k)!=null)
			throw new Error("duplicate key error index")
	} else {
		if (_.isArray(k)) {
			_.each(k, function (k1) {
				self._set(k1,v);
			})
		}
		else
			return this._set(k,v)
	}
}

tindex.prototype._set = function (k,v) {
	if (k==null) {
		this._nuls[v]=1;
		return;
	}
	if (this._unique)
		return this._bp.set(k,v);
	else {
		var l = this._bp.get(k);
		var n = l || [];
		n.push(v);
		if (!l) this._bp.set(k,n);
	}
}

tindex.prototype.del = function (k_,v) {
	var self = this;
	var k = this._get(k_);
	if (_.isArray(k)) {
		_.each(k, function (k1) {
			self._del(k1,v);
		})
	}
	else
		return this._del(k,v)
}

tindex.prototype._del = function (k,v) {
	delete
		this._nuls[v];
	if (this._unique) {
		this._bp.del(k) 
	}
	else {
		var l = this._bp.get(k);
		if (l) {
			var i = l.indexOf(v);
			if (i!=-1) 
				l.splice(i,1);
			if (l.length==0)
				this._bp.del(k)
		}
	}
}

tindex.prototype.match = function (k) {
	var m = this._bp.get(k);
	if (!m) return [];
	return this._unique?[m]:m;
}

tindex.prototype.range = function (s, e, si, ei) {
	var r = this._bp.rangeSync(s,e,si,ei);
	return this._unique?r:_.flatten(r);
}

tindex.prototype.all = function () {
	var r = _.union(this._bp.all(), _.keys(this._nuls));
	return this._unique?r:_.flatten(r);
}

tindex.prototype.nuls = function () {
	return _.keys(this._nuls);
}

tindex.prototype.values = function () {
	var r = this._bp.all();
	return this._unique?r:_.flatten(r);
}

tindex.prototype.count = function () {
	var c = 0;
	this._bp.each(function (k,v) {
		c+=v.length;
	});
	return c;
}

module.exports = tindex;
