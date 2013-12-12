
/* Modules */
var express = require('express')
, app = express()
, fs = require('fs.extra')
, helper = require('../../lib/helpers.js')
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
                var musicName = infoRequest.replace(/\+/g, " ");
				functions.getInfo(req, res, musicName);
			break;	
			case('loadItems'):
				functions.loadItems(req,res);
			break;	
		}
	} else if (!optionalParam){
		//Do nothing
		return;
	} else  if(action === 'play') {
		var albumTitle = infoRequest.replace(/\+/g, " ");
		functions.playTrack(req, res, albumTitle, optionalParam);
	};
}