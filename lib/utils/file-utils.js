/* Global imports */
var colors = require('colors'),
	_ = require('underscore');

/**
 Reads a folder and writes all files to a json
 @param dir         string, Directory with files
 @param suffix      The file suffix
 @param callback    The Callback function
 */
exports.getLocalFiles = function (dir, suffix, callback) {
    var fs = require('fs'),
	    walk = require('walk'),
	    path = require('path');

    var walker = walk.walk(dir);
    var returnFiles = [];
	var uniqueFileNames = {};
    walker.on('file', function(root, fileStat, next) {
        var filePath = path.join(root, fileStat.name);
        root = path.normalize(root);
        if (fileStat.name.match(suffix)) {
	        var fileObject = { 'href': filePath, 'dir': root, 'file': fileStat.name };
	        if (!uniqueFileNames.hasOwnProperty(fileObject.file)) {
		        returnFiles.push(fileObject);
		        uniqueFileNames[fileObject.file] = true;
	        }
        }

        next();
    });

    walker.on('end', function(err) {
        callback(err, returnFiles);
    });
};

/**
 Reads a folder and writes all files to a json
 @param dir         string, Directory with files
 @param filename    The filename to search for
 @param callback    The Callback function
 */
exports.getLocalFile = function (dir, filename, callback) {
	this.getLocalFiles(dir, '', function(err, returnFiles) {
		_.forEach(returnFiles, function(file) {
			if (file.file === filename) {
				callback(err, file);
			}
		});

		callback(err, null);
	});
};

/**
 Removes corrupted directories.
 @param checkDir 		dir to check
 @param callback        The Callback
 */
exports.removeBadDir = function (checkDir, callback){
	var rimraf = require('rimraf'),
		async  = require('async');

	rimraf(checkDir, function (err) {
		if(!err){
			console.log('Removed bad dir', checkDir .yellow);
			setTimeout(function(){
				/* Send string to client to trigger reload of bad item */
				console.log('Bad dir was found,sending message to client' .yellow);
				callback('bad dir');
			},1000);
		} else {
			console.log('Removing dir error:', err .red);
		}
	});
};
