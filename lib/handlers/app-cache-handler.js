/* Global imports */
var fs = require('fs.extra'),
	path = require('path'),
	config = require('./configuration-handler').getConfiguration();

/* Variables */
var cache_dir = config.data_storage_dir;
var frontend_cache_dir = '/' + path.basename(cache_dir);

exports.ensureCacheDirExists = function (app, subdir) {
	var dir = path.join(cache_dir, app, subdir);

	console.log(dir);
	if (!fs.existsSync(dir)) {
		fs.mkdirs(dir, function (err) {
			if (err) console.log('Error creating folder', err .red);
		});
	}
};

exports.getCacheDir = function (app, subdir) {
	return path.join(cache_dir, app, subdir);
};

exports.getCachePath = function (app, subdir, file) {
	return path.join(cache_dir, app, subdir, file);
};

exports.getFrontendCachePath = function (app, subdir, file) {
	return path.join(frontend_cache_dir, app, subdir, file);
};

exports.clearCache = function(app, callback) {
	var walk = require('walk');
	var walker = walk.walk(this.getCacheDir(app, ''));

	walker.on('file', function(root, fileStat, next) {
		var filePath = path.join(root, fileStat.name);
		fs.deleteSync(filePath);

		next();
	});

	walker.on('directories', function(root, dirStatsArray, next) {
		dirStatsArray.forEach(function(dirStat) {
			var dirPath = path.join(root, dirStat.name);
			fs.deleteSync(dirPath);
		});
		next();
	});

	walker.on('end', function(err) {
		callback(err);
	});
};
