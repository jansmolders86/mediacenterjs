/* Global imports */
var fs = require('fs.extra'),
	path = require('path'),
	config = require('./configuration-handler').getConfiguration();

/* Constants */

/* Variables */
var cache_dir = config.data_storage_dir;
var frontend_cache_dir = '/' + path.basename(cache_dir);

/**
 Ensures that the Cache-Directory exists.
 */
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
