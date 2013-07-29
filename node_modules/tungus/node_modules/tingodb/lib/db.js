var safe = require('safe');

function tdb() {
	var _path = "";
}

module.exports = tdb;

tdb.prototype.init = function (path, options, cb) {
	this._path = path;
	cb(null)
}
