
/* Modules */
var express = require('express')
, app = express()
, fs = require('fs.extra')
, ini = require('ini')
, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'))
, helper = require('../../lib/helpers.js')
, functions = require('./music-functions');
 
// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
exports.engine = 'jade';

exports.index = function(req, res, next){	
	var dir = config.musicpath
	, writePath = './public/music/data/musicindex.js'
	, getDir = true
	, fileTypes = new RegExp("\.(mp3)","g");
	
	helper.getLocalFiles(req, res, dir, writePath, getDir, fileTypes, function(status){
		var musicfiles = []
		,musicfilepath = './public/music/data/musicindex.js'
		,musicfiles = fs.readFileSync(musicfilepath)
		,musicfileResults = JSON.parse(musicfiles)	
		
		res.render('music',{
			music: musicfileResults,
			selectedTheme: config.theme,
			status:status
		});
	});
};

exports.get = function(req, res, next){	
	var infoRequest = req.params.id
	, optionalParam = req.params.optionalParam
	, action = req.params.action;
	
	if(!action){
		switch(optionalParam) {
			case('info'):
				functions.getInfo(req, res, infoRequest);
			break;	
			case('album'):
				functions.getAlbum(req, res, infoRequest);
			break;	
			default:
				//Do nothing
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