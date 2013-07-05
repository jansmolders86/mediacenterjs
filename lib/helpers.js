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
	getLocalFiles: function (req, res, dir, writePath, getDir, fileTypes, callback) {
		var fs = require('fs')	
		, colors = require('colors');
		
		var	status = null
		console.log('Getting files from:', dir .green)
		fs.readdir(dir,function(err,files){
			if (err){
				status = 'wrong or bad directory, please specify a existing directory';
				console.log('Helper error:',err .red);
				callback(status);
			}else{
				var allFiles = new Array();
				files.forEach(function(file){
					var fullPath = dir + file
					stats = fs.lstatSync(fullPath);
					if (stats.isDirectory(file)) {
						var subdir = file
						, subPath = dir + file
						, files = fs.readdirSync(subPath);
						if(getDir === true){
							allFiles.push(file);
						} else if (getDir === false) {
							files.forEach(function(file){
								if (file.match(fileTypes)){
									var subFile = 'subdir='+subdir+'&file='+file
									allFiles.push(subFile);
								}
							});
						}
					} else { 
						if (file.match(fileTypes)){
							allFiles.push(file); 
						}
					}
				});
				var allFilesJSON = JSON.stringify(allFiles, null, 4);
				fs.writeFile(writePath, allFilesJSON, function(e) {
					if (!e) {
						console.log('Helper: Writing json with files' .green);
						callback(status);
					}else{ 
						console.log('Helper: Error writing json with files', e .red);
					};
				});
			};
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
				setTimeout(function(){console.log('Helper: Waiting for retry...' .yellow)},10000);
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
		console.log(checkDir)
		var rimraf = require('rimraf')
		, colors = require('colors');
		rimraf(checkDir, function (e) {
			if(!e){
				console.log('Removed bad dir', checkDir .yellow);
				setTimeout(function(){
					/* Send string to client to trigger reload of bad item */
					console.log('Bad dir was found,sending message to client' .yellow)
					res.send('bad dir');
				},1000);	
			} else {
				console.log('Removing dir error:', e .red)
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
		setTimeout(function(){
			fs.writeFile(writePath, dataToWrite, function(e) {
				if (!e) {
					fs.readFile(writePath, 'utf8', function (err, data) {
						if(!err){
							res.send(data);
						}else{
							console.log('Cannot read data', err .red)
						}
					});
				}else{ 
					console.log('Error getting data', e .red);
				};
			});
		},1000);	
	}
}