var npm = require('npm')
	, fs = require ('fs');
	
var checkCurrentVersion = function(){
	var info = {};
	var data = fs.readFileSync('./package.json' , 'utf8');

	try{
		info = JSON.parse(data);
	}catch(e){
		console.log('JSON Parse Error')
	}
			
	return info;
};

exports.checkVersion = function(req, res, check) {
	npm.load([], function (err, npm) {
		npm.commands.search(["mediacenterjs"], function(err, data){
			if (err){
				console.log('NPM search error ' + err);
				return;
			} else{
				var currentInfo = checkCurrentVersion();
				for (var key in data) {
					var obj = data[key];
					if(obj.name === 'mediacenterjs' && obj.version > currentInfo.version){
						if(check === true){
							res.json(true)
						} else {
							/*var plugin = []
							plugin.push(obj.name);
							npm.config.get("force")
							npm.commands.install(plugin, function(err, data){
								if (err){
									console.log('NPM install error ' + err);
									return;
								} else{
									console.log('Update successfull ');
									res.json('Done');
								}
							});
							
							var spawn = require("child_process").spawn;
							spawn("npm", [ "update", "mediacenterjs" ], {
							  cwd: process.cwd() + "/",
							  env: process.env
							});
							*/
							
							
						}
					}
				}
			}
		});
	});
}

