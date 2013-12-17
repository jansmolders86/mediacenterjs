var fs = require("fs")
, npm = require('npm');

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
                    npm.commands.update([obj.name], function(err, data){
                        if (err){
                            console.log('NPM install error ' + err);
                            npm.commands.restart;
                        } else{
                            console.log('Update successfull installed.', data);
                            npm.commands.restart;
                        }
                    });
                }
            }
        }
    });
});

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