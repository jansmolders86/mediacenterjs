var _ = require('lodash');

var inproc_id = -1;
var tempset = {};
function ObjectID(val) {
	// every new instance will have temporary inproc unique value
	// minus sign will let know to db layer that value is temporary
	// and need to be replaced
	this.id = --inproc_id;
	this._init(val);
	// we need to keep track all temporary instances with goal
	// to update them at later tima
	if (this.id<0) {
		if (!tempset[this.id])
			tempset[this.id]=[this];
		else 
			tempset[this.id].push(this);
	}
}	

ObjectID.prototype._persist = function (v) {
	var oldid = this.id;
	if (oldid<0) {
		_.each(tempset[oldid], function (oid) {
			oid.id = v;
		});
		delete tempset[oldid];
	}
}

ObjectID.prototype._init = function (val) {
	if (_.isNumber(val))
		this.id = val;	
	else if (val instanceof ObjectID)
		this.id = val.id;
	else if (_.isString(val)) {
		if (/^-?\d+$/.test(val))
			this.id = parseInt(val)
		else 
			this.id = NaN;
	}
	if (val && isNaN(this.id))
		throw new Error("ObjectId should be ObjectId (whatever it is designed to be) "+val)
}

ObjectID.prototype.toString = ObjectID.prototype.inspect = function () {
	return this.id.toString();
}

ObjectID.prototype.toJSON = ObjectID.prototype.valueOf = function () {
	return this.id;
}

ObjectID.prototype.equals = function (val) {
	if (val instanceof ObjectID)	
		return this.id==val.id;
	else {
		var temp = new ObjectID(val);
		return this.id==temp.id;
	}
}

// Something for fake compatibiltity with BSON.ObjectId
ObjectID.prototype.toHexString = function () {
	var l = this.id.toString();
	var zeros = "000000000000000000000000";	
	return zeros.substr(0,zeros.length - l.length)+l;
}

ObjectID.createFromHexString = ObjectID.createFromString = function (str) {
	return new ObjectID(str);
}
		
module.exports = ObjectID;
