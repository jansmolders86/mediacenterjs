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
		var	status = null
		console.log('Getting files from:', dir)
		fs.readdir(dir,function(err,files){
			if (err){
				status = 'wrong or bad directory, please specify a existing directory';
				console.log(status);
				callback(status);
			}else{
				var allFiles = new Array();
				files.forEach(function(file){
					var fullPath = dir + file
					stats = fs.lstatSync(fullPath);
					if (stats.isDirectory(file)) {
						var subPath = dir + file
						, files = fs.readdirSync(subPath);
						if(getDir === true){
							console.log('found dir:', file)
							allFiles.push(file);
						} else {
							// Added empty match for files inside a directory
							if (file.match(fileTypes) || file.match("")){
								console.log('found dir with files:', file+'/'+files)
								allFiles.push(file+'/'+files);
							}
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
						console.log('Writing json with files', allFilesJSON);
						callback(status);
					}else{ 
						console.log('Error writing json with files', e);
					};
				});
			};
		});
	},
	/**
		This funtion does a ajax call 
		@param url 			URL to call
		@param callback		Callback function
	*/
	 xhrCall: function (url,callback) { 
		var request = require("request");
		request({
			url: url,
			headers: {"Accept": "application/json"},
			method: "GET"
		}, function (error, response, body) {
			if(!error){
				callback(body);
			}else{
				console.log('XHR Error',error);
			}
		});
	}
}