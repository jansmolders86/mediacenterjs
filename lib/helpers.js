module.exports = function(){


	function writeSettings(req, res, callback){
		var myData = {
			moviepath : req.body.movielocation
			,highres: req.body.highres
			,musicpath : req.body.musiclocation
			,tvpath : req.body.tvlocation
			,language : req.body.language
			,onscreenkeyboard: req.body.usekeyboard
			,location: req.body.location
			,screensaver: req.body.screensaver
			,showdetails: req.body.showdetails
		}
		
		fs.writeFile(configfilepath, JSON.stringify(myData, null, 4), function(e) {
			if(e) {
				// Respond to client with sever error
				res.send(500);
				console.log('Error wrting settings',err);
			} else {
				setTimeout(function(){
					callback();
				},1000);			
			}
		}); 
	}
	
	
	
	function xhrCall(url,callback) { 
		request({
			url: url,
			headers: {"Accept": "application/json"},
			method: "GET"
		}, function (error, response, body) {
			if(!error){
				callback(body);
			}else{
				console.log(error);
			}
		});
	};
	
	
}
