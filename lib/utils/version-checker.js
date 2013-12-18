var npm = require('npm');
var fs = require ('fs');
    
exports.checkVersion = function(req, res) {
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
                        var message = 'New version '+obj.version+' Available';
                        console.log(message);
						res.json(message);
					}
				}
			}
		});
	});
}

var checkCurrentVersion = function(){
	var info = {};
	var data = fs.readFileSync('./package.json' , 'utf8');

	try{
		info = JSON.parse(data);
	}catch(e){
		console.log('JSON Parse Error', e);
	}
	
	return info;
};


