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
        var foundFile = false;
		_.forEach(returnFiles, function(file) {
			if (file.file === filename) {
				callback(err, file);
                foundFile = true;
			}
		});
        if (!foundFile) {
            callback(err, null);
        }
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

exports.downloadFile = function (src, output, options, callback){
    var wget = require('wget');
    var download = wget.download(src, output, options);
    download.on('error', function(err) {
        console.log('Error', err);
        callback();
    });
    download.on('end', function(output) {
        console.log('File downloaded succesfully...');
        setTimeout(function(){
            console.log('Continuing...')
            callback(output);
        },3000);
    });
    download.on('progress', function(progress) {
        console.log(progress);

    });
}