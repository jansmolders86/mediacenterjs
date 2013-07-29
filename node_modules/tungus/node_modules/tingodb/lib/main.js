module.exports = function (opts) {
	opts = opts || {};
	var db = require('./tdb.js');
	var ObjectID = opts.nativeObjectID ? require("mongodb").ObjectID : require("./ObjectId");
	if (opts.nativeObjectID) {
		ObjectID.prototype.valueOf = function () {
			return this.toString();
		}
	}
	function gdb (path,optsLocal) {
		gdb.superclass.constructor.call(this, path, optsLocal, opts);
		this.ObjectID = ObjectID;
		this.Code = require('./tcode.js').Code;
		this.Binary = require('./tbinary.js').Binary;
		this.Finder = require("./finder")(this);		
	}
	var F = function() { }
    F.prototype = db.prototype
    gdb.prototype = new F()
    gdb.prototype.constructor = gdb
    gdb.superclass = db.prototype	
	return {
		Db:gdb,
		Collection:require('./tcoll.js'),
		Code:require('./tcode.js').Code,
		Binary:require('./tbinary.js').Binary,
		ObjectID:ObjectID
	}
}
