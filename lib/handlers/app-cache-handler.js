/* Global imports */
var fs = require('fs.extra'),
	path = require('path'),
    url = require('url'),
    configuration_handler = require('./configuration-handler'),
    config = configuration_handler.initializeConfiguration();

/* Variables */
var cache_dir = config.data_storage_dir;
var frontend_cache_dir = '\\' + path.basename(cache_dir);



exports.ensureCacheDirExists = function (app, subdir) {
	var dir = path.join(cache_dir, app, subdir);

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
	return path.join(this.getCacheDir(app, subdir), file);
};

exports.getFrontendCachePath = function (app, subdir, file) {

    // Using path sometimes gives corrupted urls cross platform
    // Although this method is a lot more verbose,
    // It will always pass a proper URL to the frontend

    //Check/format subdir path
    subdir.replace(/\\/g,"/");
    subdirHasBackslashes = (/\//ig).test(subdir);
    if(subdirHasBackslashes === true){
        var subdirpath = subdir
    } else {
        var subdirpath = subdir+'/'
    }

    var joinedPath = frontend_cache_dir+'/'+app+'/'+subdirpath+file;

    var frontendFriendlyUrl = joinedPath.replace(/\\/g,"/");

	return frontendFriendlyUrl;
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

exports.downloadDataToCache = function(app, subdir, url, callback) {
	if (url) {
		var downloader = require('downloader');
		var cache_dir = this.getCacheDir(app, subdir) + '/';
		if (fs.existsSync(cache_dir + path.basename(url)) === true) {
			return callback(null);
		} else {
			downloader.on('error', function(msg) { console.log('error', msg); });
			downloader.download(url, cache_dir);

			return callback(null);
		}
	} else {
		return callback('No URL specified!');
	}
};
