
/* Modules */
var express = require('express')
, app = express()
, fs = require('fs.extra')
, config = require('../../lib/handlers/configuration-handler').getConfiguration()
, functions = require('./music-functions');
 
// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
exports.engine = 'jade';

exports.index = function(req, res, next){	
	res.render('music',{
		selectedTheme: config.theme
	});
};

exports.get = function(req, res, next){	
	var infoRequest = req.params.id
	, optionalParam = req.params.optionalParam
	, action = req.params.action;
	
	if (optionalParam === undefined){
		switch(infoRequest) {
			case('loadItems'):
				functions.loadItems(req,res);
			default:
				return;
			break;		
		}	
	}
	
	if(!action){
		switch(optionalParam) {
			case('info'):
                console.log('getting info')
				functions.getInfo(req, res, infoRequest);
			break;	
			case('loadItems'):
				functions.loadItems(req,res);
			break;
			default:
				functions.getInfo(req, res, infoRequest);
				return;
			break;		
		}
	} else if (!optionalParam){
		//Do nothing
		return;
	} else  if(action === 'play') {
		functions.playTrack(req, res, infoRequest, optionalParam);
	};
}