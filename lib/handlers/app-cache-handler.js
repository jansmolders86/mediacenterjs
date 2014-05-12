/*
	MediaCenterJS - A NodeJS based mediacenter solution
	
    Copyright (C) 2014 - Jan Smolders

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
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

/**
Get frontend friendly URL to cached file
 @param app 	    	app cache dir
 @param subdir 	    	subdir within app cache dir
 @param filename	    Name of file
 */
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

/**
Download images to cache dir
 @param app 	    	app cache dir
 @param subdir 	    	subdir within app cache dir
 @param url	    		URL of image to be downloaded
 @param callback        The Callback (returns the contents as string)
 */
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
