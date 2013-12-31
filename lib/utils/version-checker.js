var fs = require ('fs');
var ajax_utils = require('../../lib/utils/ajax-utils');
    
exports.checkVersion = function(req, res) {
	var url = 'https://raw.github.com/jansmolders86/mediacenterjs/master/package.json';
	ajax_utils.xhrCall(url, function(response) {
		var obj = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
		var remote = JSON.parse(response)
		if(remote.version > obj.version){
		   var message = 'New version '+remote.version+' Available';
         console.log(message);
	  		res.json(message);
		} else{
			console.log('Current version up to date.')		
		}
	});
}
