module.exports = function(obj, name) {

	function xhrCall(url,callback) { 
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
	};
	
	function updateMusic(req, res, dir, path, callback) { 
	var	status = null
	
	console.log('Getting music from:', dir)
	fs.readdir(dir,function(err,files){
		if (err){
			status = 'wrong or bad directory, please specify a existing directory';
			console.log(status);
			callback(status);
		}else{
			var allMusic = new Array();
			files.forEach(function(file){
				var fullPath = dir + file
				stats = fs.lstatSync(fullPath);
				if (stats.isDirectory(file)) {
					var subPath = dir + file
					, files = fs.readdirSync(subPath);
					console.log('found album', file)
					allMusic.push(file);
				} else {
					allMusic.push(file);
				}
			});
			var allMusicJSON = JSON.stringify(allMusic, null, 4);
			fs.writeFile(path, allMusicJSON, function(e) {
				if (!e) {
					console.log('Updating musiclist', allMusicJSON);
					callback(status);
				}else{ 
					console.log('Error getting musiclist', e);
				};
			});
		};
	});
};
	

}