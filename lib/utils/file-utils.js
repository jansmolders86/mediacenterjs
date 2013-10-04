/* Global imports */
var colors = require('colors');

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
    walker.on('file', function(root, fileStat, next) {
        var filePath = path.join(root, fileStat.name);
        root = path.normalize(root);
        if (fileStat.name.match(suffix)) {
            returnFiles.push({ 'href': filePath, 'dir': root, 'file': fileStat.name });
        }

        next();
    });

    walker.on('end', function(err) {
        callback(err, returnFiles);
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
