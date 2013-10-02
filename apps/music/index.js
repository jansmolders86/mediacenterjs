
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
	, suffix = new RegExp("\.(mp3)","g");
	
	helper.getLocalFiles(req, res, dir, suffix, function(err,files){
		var unique = {}, 
		albums = [];
		for(var i = 0, l = files.length; i < l; ++i){
			var albumDir = files[i].dir;
			var albumTitles = albumDir.substring(albumDir.lastIndexOf("/")).replace(/^\/|\/$/g, '');
			
			// filter albums on unique title
			if(unique.hasOwnProperty(albumTitles)) {
				continue;
			}
			
			//single
			if(albumTitles === '' && files[i].file !== undefined){
				albumTitles = files[i].file;
			}
			
			albums.push(albumTitles);
			unique[albumTitles] = 1;
		};
		
		res.render('music',{
			music: albums,
			selectedTheme: config.theme
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