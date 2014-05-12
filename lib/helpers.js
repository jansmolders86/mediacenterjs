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
module.exports = {
	/**
		This function reads a folder and writes the contents to a json
		@param req 			Request
		@param res			Response
		@param dir 			string, Directory with files 
		@param Writepath	string, Directory to save the JSON
		@param getDir 		boolean, true; to write only the dir, not the files inside the dir
		@param status		Returns with Callback. Gives status of function
		@param filetypes	Regex with acceptable filetypes
		@param callback		Callback function
	*/
	getLocalFiles: function (req, res, dir, suffix, callback) {
		var colors = require('colors');
		var fs = require('fs');
		var async = require('async');
		scan(dir, suffix, callback);
		// TODO Tranverse with proper knowledge on whether the input is a file or folder
		function scan(dir, suffix, callback) {
			fs.readdir(dir, function(err, files) {
				var returnFiles = [];
				if( files !== undefined ){
					async.each(files,function(file, next) {
						var filePath = dir + '/' + file;
						fs.stat(filePath, function(err, stat) {
							if (err) {
							  return next(err);
							}
							if (stat.isDirectory()) {
								scan(filePath, suffix, function(err, results) {
									if (err) {
										return next(err);
									}
									returnFiles = returnFiles.concat(results);
									next();
							  })
							}
							else if (stat.isFile()) {
								if (file.match(suffix)) {
									returnFiles.push( {href: filePath, dir: dir, file: file} );
								}
								next();
							}
						});
					}, function(err) {
						callback(err, returnFiles);
					});
				}
			});
		};
	},
	/**
		This funtion does an ajax call 
		@param url 			URL to call
		@param callback		Callback function
	*/
	 xhrCall: function (url,callback) { 
		var request = require("request")	
		, colors = require('colors');
		request({
			url: url,
			headers: {"Accept": "application/json"},
			method: "GET"
		}, function (error, response, body) {
			if(!error){
				callback(body);
			}else{
				console.log('Helper: XHR Error',error .red);
				setTimeout(function(){
					console.log('Helper: Waiting for retry...' .yellow)
				},10000);
			}
		});
	},
	/**
		This funtion removes corrupted directories.
		@param req 			Request
		@param res			Response
		@param checkDir 				dir to check
		@param redirectUrl		Path to redirect to after corrupted dirs have been removed
	*/
	removeBadDir: function (req, res, checkDir){
		console.log(checkDir);
		var rimraf = require('rimraf')
		, colors = require('colors');
		rimraf(checkDir, function (e) {
			if(!e){
				console.log('Removed bad dir', checkDir .yellow);
				setTimeout(function(){
					/* Send string to client to trigger reload of bad item */
					console.log('Bad dir was found,sending message to client' .yellow);
					res.send('bad dir');
				},1000);	
			} else {
				console.log('Removing dir error:', e .red);
			}
		});
	},
	/**
		This funtion writes data to a JSON file and then returns the contents to the client. (Ajax)
		@param req 			Request
		@param res			Response
		@param writePath 	Path to store file
		@param dataToWrite	Data to write to file
	*/
	writeToFile: function (req,res,writePath,dataToWrite){
		var fs = require('fs')	
		, colors = require('colors');
		fs.writeFile(writePath, dataToWrite, function(e) {
			if (!e) {
				fs.readFile(writePath, 'utf8', function (err, data) {
					if(!err){
						res.send(data);
					}else{
						console.log('Cannot read data', err .red);
					}
				});
			}else{ 
				console.log('Error getting data', e .red);
			};
		});
	}
}