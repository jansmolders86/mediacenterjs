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
		var walk = require('walk');
		var path = require('path');
		
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