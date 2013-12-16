var npm = require('npm')
	, fs = require ('fs')
    , path = require('path')
    , projectPath = path.resolve(process.cwd());
    
exports.checkVersion = function(req, res, check) {
	npm.load([], function (err, npm) {
        npm.config.set("force")
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
                            /*
							npm.commands.install([obj.name], function(err, data){
								if (err){
									console.log('NPM install error ' + err);
									return;
								} else{
									console.log('Update successfull ');
									res.json('Done');
								}
							});
							 */
	
                            spawnProcess('npm', ['update'], { cwd: projectPath }, function done(){
                                console.log('done!......')
                            });
                
						}
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
		console.log('JSON Parse Error')
	}
	
	return info;
};

var spawnProcess = function(command, args, options, callback) {
    var spawn = require('child_process').spawn;
    var process = spawn(command, args, options);
    var err = false;

    process.stdout.on('data', function(data) {
        console.log('stdout', data);
    });

    process.stderr.on('data', function(data) {
        err = true;
        console.log('stderr', data);
    });

    if (typeof callback === 'function') {
        process.on('exit', function() {
            if (!err) {
                return callback();
            }
        });
    }
};


