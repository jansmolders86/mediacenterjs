var safe = require('safe');
var _ = require('lodash');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var async = require('async');
var tcursor = require('./tcursor');
var wqueue = require('./wqueue');
var tindex = require('./tindex');
var tcache = require("./tcache");
var Code = require('./tcode').Code;

function tcoll() {
	var self = this;
	this._tdb = null;
	this._name = null;
	this._store = {};
	this._fd = null;
	this._fsize = null;
	this._id = 1;
	this._wq = new wqueue();
	this._tq = null;
	this._idx = {};
	this._cache = null;
	this._mc = {};
	// native mongo db compatibility attrs
	this.collectionName = null;
}

module.exports = tcoll;

tcoll.prototype.init = function (tdb, name, options, cb) {
	var self= this;
	this._tdb = tdb;
	this._cache = new tcache(tdb, tdb._gopts.cacheSize);
	this._cmaxobj = tdb._gopts.cacheMaxObjSize || 1024;
	this.collectionName = this._name = name;
	this._filename = path.join(this._tdb._path, this._name);
	var pos = 0;
	var deleted = 0;
	this._tq = new wqueue(100, function (cb) {
		(function (cb) {
			fs.open(self._filename, "a+", safe.sure(cb, function (fd) {
			self._fd = fd;
			var b1 = new Buffer(45);
			async.whilst(function () { return self._fsize==null; }, function(cb) {
				(function (cb) {
					fs.read(fd, b1, 0, 45, pos, safe.trap_sure(cb, function (bytes, data) {
						if (bytes==0) {
							self._fsize = pos;
							return cb();
						}
						var h1 = JSON.parse(data.toString());
						h1.o = parseInt(h1.o,10);
						h1.k = parseInt(h1.k,10);
						var b2 = new Buffer(h1.k);
						fs.read(fd,b2,0,h1.k,pos+45+1, safe.sure(cb, function (bytes, data) {
							var k = JSON.parse(data.toString());
							self._id = k._uid
							if (k._a=='del') {
								delete self._store[k._id];
								deleted++;
							} else {
								if (self._store[k._id]) deleted++;
								self._store[k._id] = { pos: pos, sum: k._s };
							}
							pos+=45+3+h1.o+h1.k;
							cb();
						}))
					}))
				})(function (err) {
					if (err) cb(new Error(self._name+": Error during load - "+err.toString()))
						else cb()
				})
			}, cb)
			}));
		})(safe.sure(cb, function () {
			safe.run(function (cb) {
				var size = _.size(self._store);
				if (deleted > size) {
					self._compact(function (err) {
						if (err) console.log(err);
						cb();
					});
				} else cb();
			}, function () {
				// update indexes
				async.forEachSeries(_.values(self._store), function (rec, cb) {
					self._get(rec.pos, safe.sure(cb, function (obj) {
						var id = simplifyKey(obj._id);
						_(self._idx).forEach(function(v, k) {
							v.set(obj, id);
						});
						cb();
					}));
				}, cb);
			});
		}))
	})
	self.ensureIndex({_id:1},{unique:true},cb);
}

tcoll.prototype._compact = function (cb) {
	var self = this;
	var filename = self._filename + '.compact';
	fs.open(filename, 'w+', safe.sure(cb, function (fd) {
		var b1 = new Buffer(45);
		function get(pos, cb) {
			fs.read(self._fd, b1, 0, 45, pos, safe.trap_sure(cb, function (bytes, data) {
				var h1 = JSON.parse(data.toString());
				h1.o = parseInt(h1.o, 10);
				h1.k = parseInt(h1.k, 10);
				var b2 = new Buffer(h1.k + h1.o + 3);
				fs.read(self._fd, b2, 0, b2.length, pos + 45, safe.sure(cb, function (bytes, data) {
					cb(null, Buffer.concat([ b1, b2 ]));
				}));
			}));
		}
		var wpos = 0;
		var store = {};
		async.forEachSeries(_.keys(self._store), function (k, cb) {
			var rec = self._store[k];
			get(rec.pos, safe.sure(cb, function (data) {
				fs.write(fd, data, 0, data.length, wpos, safe.sure(cb, function (written) {
					if (written != data.length) return cb(new Error('Insufficient disk space'));
					store[k] = { pos: wpos, sum: rec.sum };
					wpos += data.length;
					cb();
				}));
			}));
		}, function (err) {
			if (err) {
				fs.close(fd, function () {
					fs.unlink(filename, function () {
						cb(err);
					});
				});
				return;
			}
			fs.rename(filename, self._filename, safe.sure(cb, function () {
				fs.close(self._fd);
				self._fd = fd;
				self._fsize = wpos;
				self._store = store;
				cb();
			}));
		});
	}));
};

tcoll.prototype.drop = function (cb) {
	this._tdb.dropCollection(this._name,cb)		
}

tcoll.prototype.rename = function (nname, opts, cb) {
	var self = this;
	var err = self._tdb._nameCheck(nname);
	if (err)
		return safe.back(cb,err);
	self._tq.add(function (cb) {		
		fs.rename(path.join(self._tdb._path,self._name),path.join(self._tdb._path,nname),safe.sure(cb, function () {
			delete self._tdb._cols[self._name];
			self._tdb._cols[nname] = self;
			self.collectionName = self._name = nname;			
			cb();
		}))
	},true,cb);		
}	

tcoll.prototype._stop = function (cb) {
	var self = this;
	self._tq.add(function (cb) {	
		// this will prevent any tasks processed on this instance
		self._tq._stoped = true;
		if (self._fd) {
			fs.close(self._fd,safe.sure(cb, function () {
				cb(null,true)
			}))
		} else
			cb(null,false);
	},true,cb);	
}


tcoll.prototype.createIndex = tcoll.prototype.ensureIndex = function (obj, options, cb) {
	var self = this;
	if (_.isFunction(options) && cb == null) {
		cb = options;
		options = {};
	}
	cb = cb || function () {};
	options = options || {};
	
	var c = new tcursor(this,{},{},{});
	c.sort(obj);
	if (c._err)
		return safe.back(cb,c._err);
	var key = c._sort;
	
	if (key==null)
		return self.back(cb,new Error("No fields are specified"));

	var index = self._idx[key];
	if (index)
		return safe.back(cb,null, index.name);
		
	// force array support when global option is set
	if (_.isUndefined(options._tiarr) && self._tdb._gopts.searchInArray)
		options._tiarr = true;
		
	index = new tindex(key, self, options, key+"_"+(key=='_id'?'':c._order))
	
	if (self._tq._tc==-1) {
		// if no operation is pending just register index
		self._idx[key] = index;
		safe.back(cb, null, index.name);
	}
	else {
		// overwise register index operation
		this._tq.add(function (cb) {	
			var range = _.values(self._store);	
			async.forEachSeries(range, function (rec, cb) {
				self._get(rec.pos, safe.sure(cb, function (obj) {
					index.set(obj,simplifyKey(obj._id));
					cb()
				}))
			}, safe.sure(cb, function () {
				self._idx[key] = index;
				cb()
			}))
		}, true, function (err) {
			if (err) cb(err);
			else cb(null, index.name);
		});
	}
}

tcoll.prototype.indexExists = function (idx, cb) {
	if (!_.isArray(idx))
		idx = [idx]
	var i = _.intersection(idx,_(this._idx).values().map('name').value());
	cb(null,i.length == idx.length);
}

tcoll.prototype.indexes = function (cb) {
	var self = this;
	this._tq.add(function (cb) {	
		cb(null, _.values(self._idx));
	},false,cb);	
}

tcoll.prototype._get = function (pos, cb) {
	var self = this;
	var cached = self._cache.get(pos);
	if (cached)
		return safe.back(cb,null,cached);
	var b1 = new Buffer(45);
	fs.read(self._fd, b1, 0, 45, pos, safe.trap_sure(cb, function (bytes, data) {
		var h1 = JSON.parse(data.toString());
		h1.o = parseInt(h1.o,10);
		h1.k = parseInt(h1.k,10);
		var b2 = new Buffer(h1.o);
		fs.read(self._fd,b2,0,h1.o,pos+45+2+h1.k, safe.trap_sure(cb, function (bytes, data) {
			var obj = self._unwrapTypes(JSON.parse(data.toString()));
			if (bytes <= self._cmaxobj)
				self._cache.set(pos, obj);
			cb(null,obj);
		}))
	}))
}

tcoll.prototype.insert = function (docs, opts, cb ) {
	var self = this;
	if (_.isFunction(opts) && cb == null) {
		cb = opts;
		opts = {};
	}
	opts = opts || {};
	if (opts.w>0 && !_.isFunction(cb))
		throw new Error("Callback is required for safe update");	
	cb = cb || function () {};
	if (!_.isArray(docs))
		docs = [docs];	
	this._tq.add(function (cb) {		
		async.forEachSeries(docs, function (doc, cb) {
			if (_.isUndefined(doc._id)) {
				doc._id = new self._tdb.ObjectID();
			}
			self._put(doc, false, cb);
		}, safe.sure(cb, function () {
			cb(null, docs);
		}))
	}, true, cb)
}

tcoll.prototype._wrapTypes = function(obj) {
	var self = this;
	_.each(obj, function (v,k) {
		if (_.isDate(v))
			obj[k] = {$wrap:"$date",v:v.valueOf(),h:v}
		else if (v instanceof self._tdb.ObjectID)
			obj[k] = {$wrap:"$oid",v:v.toJSON()}
		else if (v instanceof self._tdb.Binary)
			obj[k] = {$wrap: "$bin", v: v.toJSON()};
		else if (_.isObject(v))
			self._wrapTypes(v)
			
	})
	return obj;
}

tcoll.prototype._ensureIds = function(obj) {
	var self = this;
	_.each(obj, function (v,k) {
		if (k.length >0) {
			if (k[0]=='$')
				throw new Error("key "+k+" must not start with '$'");;
			if (k.indexOf('.')!=-1)
				throw new Error("key "+k+" must not contain '.'");
		}
		if (_.isObject(v)) {
			if (v instanceof self._tdb.ObjectID) {
				if (v.id<0) {
					v._persist(++self._id)
				}
			}
			else
				self._ensureIds(v)
		}
	})
	return obj;
}


tcoll.prototype._unwrapTypes = function(obj) {
	var self = this;
	_.each(obj, function (v,k) {
		if (_.isObject(v)) {
			switch (v.$wrap) {
				case "$date": obj[k] = new Date(v.v); break;
				case "$oid": 
					var oid = new self._tdb.ObjectID(v.v);
					if (!oid.$oid)
						oid.$oid = oid.toJSON();
					obj[k]=oid;
				break;
				case "$bin": 
					var bin = new self._tdb.Binary(new Buffer(v.v, 'base64'));
					obj[k] = bin;
				break;
				default: self._unwrapTypes(v);
			}
		}
	})
	return obj;
}
	
tcoll.prototype._put = function (item, remove, cb) {
	var self = this;
	self._wq.add(function (cb) {	
		try {		
			item = self._ensureIds(item);
		} catch (err) {
			err.errmsg = err.toString();
			return cb(err)
		}			
		if (_.isUndefined(item._id))
			return cb(new Error("Invalid object key (_id)"));		
		item = self._wrapTypes(item);			
		var sobj = new Buffer(remove?"":JSON.stringify(item));
		item = self._unwrapTypes(item);			
		var key = {_id:simplifyKey(item._id),_uid:self._id,_dt:(new Date()).valueOf()};
		if (remove) key._a = "del";
		else {
			var hash = crypto.createHash('md5');
			hash.update(sobj, 'utf8');
			key._s = hash.digest('hex');
		}
		var skey = new Buffer(JSON.stringify(key));		
		var zeros = "0000000000";
		var lobj = sobj.length.toString();
		var lkey = skey.length.toString();
		lobj = zeros.substr(0,zeros.length - lobj.length)+lobj;
		lkey = zeros.substr(0,zeros.length - lkey.length)+lkey;
		var h1={k:lkey,o:lobj,v:"001"};
		var buf = new Buffer(JSON.stringify(h1)+"\n"+skey+"\n"+sobj+"\n");
					
		// check index update
		if (item && !remove) {
			try {
				_(self._idx).forEach(function(v,k) {
					v.set(item,key._id,true);
				})
			} catch (err) {
				err.errmsg = err.toString();
				return cb(err)
			}
		}

		safe.run(function (cb) {
			var rec = self._store[key._id];
			if (rec && rec.sum == key._s) return safe.back(cb);
			fs.write(self._fd, buf, 0, buf.length, self._fsize, safe.sure(cb, function (written) {
				if (remove)
					delete self._store[key._id];
				else
					self._store[key._id] = { pos: self._fsize, sum: key._s };
		
				if (remove || sobj.length > self._cmaxobj)
					self._cache.unset(self._fsize)			
				else
					self._cache.set(self._fsize,item);
				self._fsize+=written;
				cb();
			}));
		},
		function () {
			// update index
			_(self._idx).forEach(function(v,k) {
				if (!remove)
					v.set(item,key._id);
				else
					v.del(item,key._id);
			})
			cb(null);		
		});
	}, true, cb);
}

tcoll.prototype.count = function (query, cb) {
	var self = this;
	if (_.isFunction(query) && cb==null) {
		cb = query;
		query = null;
	}
	if (query==null || _.size(query)==0) {
		this._tq.add(function (cb) {	
			cb(null, _.size(self._store));
		},false,cb);
	} else
		self.find(query).count(cb);
}

tcoll.prototype.stats = function (cb) {
	var self = this;
	this._tq.add(function (cb) {	
		cb(null, {count:_.size(self._store)});
	},false,cb);
}


var findOpts = ['limit','sort','fields','skip','hint','timeout','batchSize'];

tcoll.prototype.findOne = function () {
	var findArgs = Array.prototype.slice.call(arguments,0,arguments.length-1);
	var cb = arguments[arguments.length-1];
	this.find.apply(this,findArgs).limit(1).nextObject(cb);
}

tcoll.prototype.find = function () {
	var cb = null, query = {}, opts = {}, fields = null, skip = null, limit = null, sort = null;
	var argc = arguments.length;
	if (argc>0) {
		// guess callback, it is always latest
		cb = arguments[argc-1];
		if (!_.isFunction(cb))
			cb=null
		else
			argc--;
		if (argc>0) {
			// query should always exist
			query = arguments[0]
			if (argc>1) {
				if (argc==2) {
					var val = arguments[1];
					// worst case we get either options either fiels
					if (_.intersection(_.keys(val),findOpts).length!=0)
						opts = val
					else 
						fields = val;
				} else {
					fields = arguments[1];
					if (argc == 3) 
						opts = arguments[2]
					else {
						skip = arguments[2];
						limit = arguments[3]
					}
				}
			}
		}
	}
	
	skip = skip || opts.skip || null;
	limit = limit || opts.limit || null;
	fields = fields || opts.fields || null;
	sort = sort || opts.sort || null;
	
	
	var c = new tcursor(this,query, fields, opts);
	
	if (skip) c.skip(skip);
	if (limit) c.limit(limit);
	if (sort) c.sort(sort);
	if (cb)
		cb(null, c)
	else
		return c;
}

function applySet(obj,$set,tdb) {
	var tdb = 
	_.each($set, function (v,k) {
		var path = k.split(".")
		var t = null;
		if (path.length==1)
			t = obj
		else {
			var l = obj;
			for (var i=0; i<path.length-1; i++) {
				var p = path[i];
				if (!l[p]) 
					l[p] = {};
				l = l[p];
			}
			t = l;
			k = path[i];
		}
		// do recursive apply for unknown objects
		if (_.isObject(v) && !(v instanceof tdb.ObjectID || _.isDate(v) || _.isFunction(v) || v instanceof tdb.Code) ) {
			if (!t[k])
				t[k]={};
			applySet(t[k],v,tdb);
		}
		else
			t[k] = v;
	})
}

function applyUnset(obj,$set) {
	_.each($set, function (v,k) {
		var path = k.split(".")
		var t = null;
		if (path.length==1)
			t = obj
		else {
			var l = obj;
			for (var i=0; i<path.length-1; i++) {
				var p = path[i];
				if (!l[p]) 
					l[p] = {};
				l = l[p];
			}
			t = l;
			k = path[i];
		}
		delete t[k];
	})
}

function applyInc(obj, $inc) {
	_.each($inc, function (v, k) {
		var path = k.split(".");
		var t = null;
		if (path.length == 1)
			t = obj
		else {
			var l = obj;
			for (var i = 0; i < path.length - 1; i++) {
				var p = path[i];
				if (!l[p]) 
					l[p] = {};
				l = l[p];
			}
			t = l;
			k = path[i];
		}
		if (!t[k]) t[k] = 0;
		t[k] += v;
	});
}

function simplifyKey(key) {
	var k = key;
	if (key.toJSON)
		k = key.toJSON();
	if (_.isNumber(k)||_.isString(k))
		return k;
	return k.toString();
}

tcoll.prototype.update = function (query, doc, opts, cb) {
	var self = this;
	if (_.isFunction(opts) && cb == null) {
		cb = opts;
	}	
	opts = opts || {};
	if (opts.w>0 && !_.isFunction(cb))
		throw new Error("Callback is required for safe update");		
	cb = cb || function () {}
	if (!_.isObject(query))
		throw new Error("selector must be a valid JavaScript object");
	if (!_.isObject(doc))
		throw new Error("document must be a valid JavaScript object");
	
	var multi = opts.multi || false;
	var $set = doc.$set;
	var $unset = doc.$unset;
	var $push = doc.$push;
	var $inc = doc.$inc;
	var $doc = ($set || $unset || $push || $inc)?null:doc;
	this._tq.add(function (cb) {	
		self.__find(query,null,0,multi?null:1,null,null, opts.hint, {}, safe.sure(cb, function(res) {
			if (res.length==0) {
				if (opts.upsert) {
					$doc = $doc || query;
					if ($set)
						applySet($doc,$set,self._tdb);
					if ($unset)
						applyUnset($doc,$unset);
					if ($inc)
						applyInc($doc, $inc);
					if (_.isUndefined($doc._id))
						$doc._id = new self._tdb.ObjectID();
					self._put($doc, false, safe.sure(cb, function () {
						cb(null, 1,{updatedExisting:false,upserted:true,n:1})
					}))
				} else
					cb(null,0);
			} else {			
				async.forEachSeries(res, function (pos, cb) {
					self._get(pos, safe.sure(cb, function (obj) {
						// remove current version of doc from indexes
						_(self._idx).forEach(function(v,k) {
							v.del(obj,simplifyKey(obj._id));
						})			
						var udoc = $doc;		
						if (!$doc) {
							udoc = obj;
							if ($set)
								applySet(udoc,$set,self._tdb);
							if ($unset)
								applyUnset(udoc,$unset);
							if ($inc)
								applyInc(udoc, $inc);
						}
						udoc._id = obj._id;
						// put will add it back to indexes
						self._put(udoc, false, cb);
					}))
				}, safe.sure(cb,function () {
					cb(null, res.length, {updatedExisting:true,n:res.length});
				}))
			}
		}))
	},true,cb);	
}

tcoll.prototype.findAndModify = function (query, sort, doc, opts, cb) {
	var self = this;
	if (_.isFunction(opts) && cb == null) {
		cb = opts;
		opts = {};
	}	
	var $set = doc.$set;
	var $unset = doc.$unset;
	var $push = doc.$push;
	var $inc = doc.$inc;
	var $doc = ($set || $unset || $push || $inc)?null:doc;
	
	var c = new tcursor(this,{}, opts.fields || {},{});
	c.sort(sort);
	if (c._err)
		return safe.back(cb,c._err);
	
	this._tq.add(function (cb) {	
		self.__find(query,null,0,1,c._sort,c._order, opts.hint, {}, safe.sure(cb, function(res) {
			if (res.length==0) {
				if (opts.upsert) {
					$doc = $doc || query;
					if ($set)
						applySet($doc,$set,self._tdb);
					if ($unset)
						applyUnset($doc,$unset);
					if ($inc)
						applyInc($doc, $inc);
					if (_.isUndefined($doc._id))
						$doc._id = new self._tdb.ObjectID();
					self._put($doc, false, safe.sure(cb, function () {
						cb(null,c._projectFields($doc))
					}))
				} else
					cb();
			} else {
				self._get(res[0], safe.sure(cb, function (obj) {
					var robj = (opts.new && !opts.remove) ? obj : self._cache.cloneDeep(obj);
					// remove current version of doc from indexes
					_(self._idx).forEach(function(v,k) {
						v.del(obj,simplifyKey(obj._id));
					})					
					var udoc = $doc;		
					if (!$doc) {
						udoc = obj;
						if ($set)
							applySet(udoc,$set,self._tdb);
						if ($unset)
							applyUnset(udoc,$unset);
						if ($inc)
							applyInc(udoc, $inc);
					}
					udoc._id = obj._id;
					// put will add it back to indexes
					self._put(udoc, opts.remove?true:false, safe.sure(cb,function () {
						cb(null,c._projectFields(robj))
					}))
				}))
			}
		}))
	},true,cb);	
}

tcoll.prototype.save = function (doc, opts, cb) {
	var self = this;
	cb = _.isFunction(doc)?doc:_.isFunction(opts)?opts:cb;
	cb = cb || function () {};
	doc = doc || {};
	opts = opts || {};
	this._tq.add(function (cb) {		
		var res = doc;
		if (_.isUndefined(doc._id)) {
			doc._id = new self._tdb.ObjectID();
		} else {
			// make sure we can save document with existing _id
			try {
				self._idx._id.set(doc,simplifyKey(doc._id),true);
			} catch (err) {
				// remove current version of doc from indexes
				_(self._idx).forEach(function(v,k) {
					v.del(doc,simplifyKey(doc._id));
				})		
				res = 1;
			}
		}
		self._put(doc, false, safe.sure(cb, function () {
			cb(null,res); // when update return 1 when new save return obj
		}))
	},true,cb);	
}		

tcoll.prototype.remove = function (query, opts, cb) {
	var self = this;
	if (_.isFunction(query)) {
		cb = query;
		query = opts = {};
	} else if (_.isFunction(opts)) {
		cb = opts;
		opts = {};
	}
	opts = opts || {};
	if (opts.w>0 && !_.isFunction(cb))
		throw new Error("Callback is required");
	cb = cb || function () {};
	var single = opts.single || false;
	this._tq.add(function (cb) {	
		self.__find(query,null,0,single?1:null,null,null, opts.hint, {}, safe.sure(cb, function(res) {
			async.forEachSeries(res, function (pos, cb) {
				self._get(pos, safe.sure(cb, function (obj) {
					self._put(obj,true,cb);
				}))
			}, safe.sure(cb, function () {
				cb(null,res.length);
			}))
		}))
	},true,cb);	
}

tcoll.prototype.findAndRemove = function (query,sort,opts,cb) {
	var self = this;
	if (_.isFunction(opts) && cb == null) {
		cb = opts;
		opts = {};
	}	

	var c = new tcursor(this,{},{},{});
	c.sort(sort);
	if (c._err)
		return safe.back(cb,c._err);
		
	this._tq.add(function (cb) {	
		self.__find(query,null,0,1,c._sort,c._order, opts.hint, {}, safe.sure(cb, function(res) {
			if (res.length==0)
				return cb();
			self._get(res[0], safe.sure(cb, function (obj) {
				self._put(obj,true,safe.sure(cb, function () {
					cb(null,obj);
				}))
			}))
		}))
	},true,cb);	
}

tcoll.prototype.__find = function (query, fields, skip, limit, sort_, order, hint, arFields, cb) {
	var sort = sort_;
	var self = this;
	var res = [];
	var range = [];
	// now simple non-index search
	var found = 0;
	var qt = self._tdb.Finder.matcher(query);
	var pi = [];
	var io = {};
	// for non empty query check indexes that we can use
	if (_.size(qt)>0) {
		_(self._idx).forEach(function (v,k) {
			if (qt._ex(k) == 1 && (!hint || hint[k]))
				pi.push(k)
		});
	}
	// if possible indexes found split the query and process
	// indexes separately
	if (pi.length>0) {
		_(pi).forEach(function (v) {
			io[v]=qt.split(v);
		})
		var p = [];
		_(io).forEach(function (v,k) {
			var r = v._index(self._idx[k]);
			p.push(r);
		})
		if (pi.length==1) {
			p=p[0];
			if (pi[0]==sort) {
				sort = null;
				if (order==-1)
					p.reverse();
			}
		} else
			p = _.intersection.apply(_,p);
		// nowe we have ids, need to convert them to positions
		_(p).forEach(function (_id) {
			range.push(self._store[_id].pos)
		})
	} else {
		if (self._idx[sort]) {
			_.each(self._idx[sort].all(), function (_id) {
				range.push(self._store[_id].pos)
			})
			if (order==-1)
				range.reverse();
			sort = null;
		} else
			range = _.values(self._store).map(function (rec) { return rec.pos; });
	}

	if (self._idx[sort]) {
		var ps = {};
		_(range).each(function (pos) {
			ps[pos] = true;
		});
		range = [];
		_(self._idx[sort].all()).each(function (_id) {
			var pos = self._store[_id].pos;
			if (_(ps).has(pos)) range.push(pos);
		});
		if (order == -1)
			range.reverse();
		sort = null;
	}

	// no sort, no query then return right away
	if (sort==null && (_.size(qt)==0 || qt._args.length==0)) {
		if (skip!=0 || limit!=null) {
			var c = Math.min(range.length-skip,limit?limit:range.length-skip);
			range = range.splice(skip,c)
		}
		return safe.back(cb,null,range);				
	}

	var matcher = null;
	// check if we can use simple match or array match function
	var arrayMatch = false;
	if (self._tdb._gopts.searchInArray)
		arrayMatch = true;
	else {
		var fields = qt.fields();
		_.each(fields, function (v,k) {
			if (arFields[k])
				arrayMatch = true;
		})
	}

	eval("matcher = function (obj) { return "+ (arrayMatch?qt.native3():qt.native()) + " }");
	
	// create sort index
	var si = null;
	if (sort) {
		si = new tindex(sort,self);
	}

	async.forEachSeries(range, function (pos, cb) {
		if (sort==null && limit && res.length>=limit) 
			return safe.back(cb);
		self._get(pos, safe.sure(cb, function (obj) {
			if (matcher(obj)) {
				if (sort!=null || found>=skip) {
					if (sort==null) 
						res.push(pos);
					else
						si.set(obj,pos);
				}
				found++;
			}
			cb()
		}))
	}, safe.sure(cb, function () {
		if (sort) {
			res = si.all();
			if (order==-1) {
				res.reverse();
			}
			if (skip!=0 || limit!=null) {
				var c = Math.min(res.length-skip,limit?limit:res.length-skip);
				res = res.splice(skip,c)
			}			
		}	
		cb(null, res);
	}))
}

tcoll.prototype._find = function (query, fields, skip, limit, sort_, order, hint, arFields, cb) {
	var self = this;
	this._tq.add(function (cb) {	
		self.__find(query, fields, skip, limit,sort_,order, hint, arFields, cb);
	}, false, cb);
}

function code2fn(obj) {
	if (_.isObject(obj)) {
		_(obj).each(function (value, key) {
			if (value instanceof Code) {
				with (value.scope) {
					obj[key] = eval('(' + value.code + ')');
				}
			}
			else code2fn(value);
		});
	}
}

tcoll.prototype.mapReduce = function (map, reduce, opts, cb) {
	var self = this;
	if (_.isFunction(opts)) {
		cb = opts;
		opts = {};
	}

	if (!opts.out) return safe.back(cb, new Error('the out option parameter must be defined'));
	if (!opts.out.inline && !opts.out.replace) {
		return safe.back(cb, new Error('the only supported out options are inline and replace'));
	}

	code2fn(opts.scope);

	var m = {};

	function emit(k, v) {
		var values = m[k];
		if (!values) m[k] = [ v ];
		else {
			values.push(v);
			if (values.length > 1000) values = [ reduce(k, values) ];
		}
	}

	with (opts.scope || {}) {
		try {
			if (map instanceof Code) {
				with (map.scope) {
					map = eval('(' + map.code + ')');
				}
			} else map = eval('(' + map + ')');
			if (reduce instanceof Code) {
				with (reduce.scope) {
					reduce = eval('(' + reduce.code + ')');
				}
			} else reduce = eval('(' + reduce + ')');
			if (finalize instanceof Code) {
				with (finalize.scope) {
					finalize = eval('(' + finalize.code + ')');
				}
			} else var finalize = eval('(' + opts.finalize + ')');
		} catch (e) {
			return safe.back(cb,e);
		}
	}

	self.find(opts.query, null, { limit: opts.limit, sort: opts.sort }, safe.sure(cb, function (c) {
		var doc;
		async.doUntil(
			function (cb) {
				c.nextObject(safe.trap_sure(cb, function (_doc) {
					doc = _doc;
					if (doc) map.call(doc);
					return cb();
				}));
			},
			function () {
				return doc === null;
			},
			safe.trap_sure(cb, function () {
				_(m).each(function (v, k) {
					v = v.length > 1 ? reduce(k, v) : v[0];
					if (finalize) v = finalize(k, v);
					m[k] = v;
				});

				var stats = {};
				if (opts.out.inline) return process.nextTick(function () {
					cb(null, _.values(m), stats); // execute outside of trap
				});

				// write results to collection
				async.waterfall([
					function (cb) {
						self._tdb.collection(opts.out.replace, { strict: 1 }, function (err, col) {
							if (err) return cb(null, null);
							col.drop(cb);
						});
					},
					function (arg, cb) {
						self._tdb.collection(opts.out.replace, {}, cb);
					},
					function (col, cb) {
						var docs = [];
						_(m).each(function (value, key) {
							var doc = {
								_id: key,
								value: value
							};
							docs.push(doc);
						});
						col.insert(docs, safe.sure(cb, function () {
							if (opts.verbose) cb(null, col, stats);
							else cb(null, col);
						}));
					}
				], cb);
			}
		)); // doUntil
	}));
};

tcoll.prototype.group = function (keys, condition, initial, reduce, finalize, command, options, callback) {
	var self = this;

	var args = Array.prototype.slice.call(arguments, 3);
	callback = args.pop();
	reduce = args.length ? args.shift() : null;
	finalize = args.length ? args.shift() : null;
	command = args.length ? args.shift() : null;
	options = args.length ? args.shift() : {};

	if (!_.isFunction(finalize)) {
		command = finalize;
		finalize = null;
	}

	code2fn(options.scope);

	with (options.scope || {}) {
		try {
			if (_.isFunction(keys)) keys = eval('(' + keys + ')');
			else if (keys instanceof Code) {
				with (keys.scope) {
					keys = eval('(' + keys.code + ')');
				}
			}
			if (reduce instanceof Code) {
				with (reduce.scope) {
					reduce = eval('(' + reduce.code + ')');
				}
			} else reduce = eval('(' + reduce + ')');
			if (finalize instanceof Code) {
				with (finalize.scope) {
					finalize = eval('(' + finalize.code + ')');
				}
			} else finalize = eval('(' + finalize + ')');
		} catch (e) {
			return callback(e);
		}
	}

	var m = {};
	self.find(condition, safe.sure(callback, function (c) {
		var doc;
		async.doUntil(
			function (cb) {
				c.nextObject(safe.sure(cb, function (_doc) {
					doc = _doc;
					if (!doc) return cb();
					var keys2 = keys;
					if (_.isFunction(keys)) keys2 = keys(doc);
					if (!_.isArray(keys2)) {
						var keys3 = [];
						_(keys2).each(function (v, k) {
							if (v) keys3.push(k);
						});
						keys2 = keys3;
					}
					var key = {};
					_(keys2).each(function (k) {
						key[k] = doc[k];
					});
					var skey = JSON.stringify(key);
					var obj = m[skey];
					if (!obj) obj = m[skey] = _.extend({}, key, initial);
					try {
						reduce(doc, obj);
					} catch (e) {
						return cb(e);
					}
					cb();
				}));
			},
			function () {
				return doc === null;
			},
			safe.sure(callback, function () {
				var result = _.values(m);
				if (finalize) {
					_(result).each(function (value) {
						finalize(value);
					});
				}
				callback(null, result);
			})
		);
	}));
};
