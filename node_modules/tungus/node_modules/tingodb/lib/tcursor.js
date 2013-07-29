var safe = require('safe');
var _ = require('lodash');
var async = require('async');
var CursorStream = require('./tstream');

function tcursor (tcoll,query,fields,opts) {
	var self = this;
	this.INIT = 0;
	this.OPEN = 1;
	this.CLOSED = 2;
	this.GET_MORE = 3;
	this._query = query;
	this._c = tcoll;
	this._i = 0;
	this._skip = 0;
	this._limit = null;
	this._count = null;
	this._items = null;
	this._sort = null;
	this._order = null;
	this._hint = opts.hint;
	this._arFields = {};
	this._fieldsType = null;
	this._fields = {};
	this.timeout = _.isUndefined(opts.timeout)?true:opts.timeout;
	
	_.each(fields, function (v,k) {
		if (!k && _.isString(v)) {
			k=v; v = 1; 
		}
		if (v == 0 || v==1) {
			if (self._fieldsType==null)
				self._fieldsType = v;
			if (self._fieldsType==v) {
				if (k.indexOf("_tiar.")==0)
					self._arFields[k.substr(6)]=1;
				else
					self._fields[k]=v;
			} else if (!self._err)
				self._err = new Error("Mixed set of projection options (0,1) is not valid");
		} else if (!self._err)
			self._err = new Error("Unsupported projection option: "+JSON.stringify(v));
	})
}

function applyProjectionDel(obj,$set) {
	_.each($set, function (v,k) {
		var path = k.split(".")
		var t = null;
		if (path.length==1)
			t = obj
		else {
			var l = obj;
			for (var i=0; i<path.length-1; i++) {
				var p = path[i];
				if (l[p]==null) 
					break;
				l = l[p];
			}
			t = i==path.length-1?l:null;
			k = path[i];
		}
		if (t)
			delete t[k];
	})
}

function applyProjectionGet(obj,$set,nobj) {
	_.each($set, function (v,k) {
		var path = k.split(".")
		var t = null,n=null;
		if (path.length==1) {
			t = obj;
			n = nobj;
		}
		else {
			var l = obj, nl = nobj;
			for (var i=0; i<path.length-1; i++) {
				var p = path[i];
				if (l[p]==null) break; l = l[p];
				if (nl[p]==null) nl[p]={}; nl = nl[p];
			}
			if (i==path.length-1) {
				t = l;
				n = nl;
			}
			k = path[i];
		}
		if (t) {
			n[k] = t[k];
		}
	})
	return nobj;
}



tcursor.prototype.isClosed  = function () {
	if (!this._items)
		return false;
	return this._i==this._items.length-1;
}

tcursor.prototype.skip = function (v, cb) {
	var self = this;
	if (!_.isFinite(v)) {
		self._err = new Error("skip requires an integer");
		if (!cb) throw self._err;
	}
	if (self._i!=0) {
		self._err = new Error('Cursor is closed');
		if (!cb) throw self._err;
	}	
	if (!self._err) 	
		this._skip = v;
	if (cb)
		process.nextTick(function () {cb(self._err,self)})
	return this;
}

tcursor.prototype.sort = function (v, cb) {
	var self = this;
	var key = null;
	if (_.isNumber(cb) || _.isString(cb)) { // handle sort(a,1)
		v={v:cb}
		cb = null
	}
	if (self._i!=0)
		this._err = new Error('Cursor is closed');
	if (!this._err) {
		if (_.isObject(v)) {
			if (_.size(v)<=2) {
				if (_.isArray(v)) {
					if (_.isArray(v[0])) {
						this._sort = v[0][0];
						this._order = v[0][1];
					} else {
						this._sort = v[0];
						this._order = 1;
					}
				} else {
					this._sort = _.keys(v)[0];
					this._order = v[this._sort];
				}
				if (this._sort) {
					if (this._order == 'asc')
						this._order = 1;
					if (this._order == 'desc')
						this._order = -1;
					if (!(this._order==1 || this._order==-1))
						this._err = new Error("Illegal sort clause, must be of the form [['field1', '(ascending|descending)'], ['field2', '(ascending|descending)']]");
				}
			} else this._err = new Error("Multi field sort is not supported");
		} else if (_.isString(v)) {
			this._sort = v;
			this._order = 1;
		} else
			this._err = new Error("Illegal sort clause, must be of the form [['field1', '(ascending|descending)'], ['field2', '(ascending|descending)']]");
	}
	if (!self._err)
		this.sortValue = v;
	if (cb)
		process.nextTick(function () {cb(self._err, self)})
	return this;
}

tcursor.prototype.limit = function (v, cb) {
	var self = this;
	if (!_.isFinite(v)) {
		self._err = new Error("limit requires an integer");
		if (!cb) throw self._err;
	}
	if (self._i!=0) {
		self._err = new Error('Cursor is closed');
		if (!cb) throw self._err;
	}		
	if (!self._err) {
		this._limit = v==0?null:Math.abs(v);
	}
	if (cb)
		process.nextTick(function () {cb(self._err,self)})
	return this;
}

tcursor.prototype.nextObject = function (cb) {
	var self = this;
	if (self._err) {	
		if (cb) process.nextTick(function () {cb(self._err)})
		return;
	}		
	self._ensure(safe.sure(cb, function () {
		if (self._i>=self._items.length)
			return cb(null, null);
		self._get(self._items[self._i], cb)
		self._i++;
	}))
}

tcursor.prototype.count = function (applySkipLimit, cb) {
	var self = this;
	if (!cb) {
		cb = applySkipLimit;
		applySkipLimit = false;
	}
	if (self._err) {	
		if (cb) process.nextTick(function () {cb(self._err)})
		return;
	}	
	if ((!self._skip && self._limit === null) || applySkipLimit) {
		self._ensure(safe.sure(cb, function () {
			cb(null, self._items.length);
		}));
		return;
	}
	if (self._count !== null) {
		process.nextTick(function () {
			cb(null, self._count);
		});
		return;
	}
	self._c._find(self._query, {}, 0, null, null, null, self._hint, self._arFields, safe.sure(cb, function (data) {
		self._count = data.length;
		cb(null, self._count);
	}));
}

tcursor.prototype.setReadPreference = function (the, cb) {
	var self = this;
	if (self._err) {	
		if (cb) process.nextTick(function () {cb(self._err)})
		return;
	}	
	return this;
}

tcursor.prototype.batchSize = function (v, cb) {
	var self = this;
	if (!_.isFinite(v)) {
		self._err = new Error("batchSize requires an integer");
		if (!cb) throw self._err;
	}
	if (self._i!=0) {
		self._err = new Error('Cursor is closed');
		if (!cb) throw self._err;
	}		
	if (cb) process.nextTick(function () {cb(self._err,self)})
	return this;
}

tcursor.prototype.close = function (cb) {
	var self = this;
	this._items = [];
	this._i=-1;
	this._err = null;
	if (cb) 
		process.nextTick(function () {cb(self._err,self)})
	return this;
}

tcursor.prototype.rewind = function () {
	this._i=0;
	return this;
}

tcursor.prototype.toArray = function (cb) {
	if (!_.isFunction(cb))
		throw new Error('Callback is required');
	var self = this;
	
	if (self.isClosed())
		self._err = new Error("Cursor is closed");
		
	if (self._err) {	
		if (cb) process.nextTick(function () {cb(self._err)})
		return;
	}
		
	self._ensure(safe.sure(cb, function () {
		var res = [];
		async.forEachSeries(self._i!=0?self._items.slice(self._i,self._items.length):self._items, function (pos,cb) {
			self._get(pos, safe.sure(cb, function (obj) {
				res.push(obj)
				cb();
			}))
		}, safe.sure(cb, function () {
			self._i=self._items.length-1;
			cb(null, res);
		}))
	}))
}

tcursor.prototype.each = function (cb) {
	if (!_.isFunction(cb))
		throw new Error('Callback is required');
			
	var self = this;
	
	if (self.isClosed())
		self._err = new Error("Cursor is closed");
	
	if (self._err) {	
		if (cb) process.nextTick(function () {cb(self._err)})
		return;
	}
	self._ensure(safe.sure(cb, function () {
		var res = [];
		async.forEachSeries(self._i!=0?self._items.slice(self._i,self._items.length):self._items, function (pos,cb1) {
			self._c._get(pos, safe.sure(cb, function (obj) {
				cb(null,obj)
				cb1();
			}))
		}, safe.sure(cb, function () {
			self._i=self._items.length-1;			
			cb(null, null);
		}))
	}))
}

tcursor.prototype.stream = function (options) {
	return new CursorStream(this, options);
};

tcursor.prototype._ensure = function (cb) {
	var self = this;	
	if (self._items!=null)
		return process.nextTick(cb);
	self._c._find(self._query, {}, self._skip, self._limit, self._sort, self._order, self._hint, self._arFields, safe.sure_result(cb, function (data) {
		self._items = data;
		self._i=0;
	}))
}

tcursor.prototype._projectFields = function (obj) {
	var self = this;
	if (self._fieldsType!=null) {
		if (self._fieldsType==0) {
			applyProjectionDel(obj,self._fields)
		}
		else
			obj = applyProjectionGet(obj, self._fields,{_id:obj._id})
	}
	return obj;
}

tcursor.prototype._get = function (pos,cb) {
	var self = this;
	self._c._get(pos, safe.sure(cb, function (obj) {
		cb(null,self._projectFields(obj))
	}))
}
		


module.exports = tcursor;
