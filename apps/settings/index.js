/*
	MediaCenterJS - A NodeJS based mediacenter solution
	
    Copyright (C) 2013 - Jan Smolders

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

exports.engine = 'jade';

var express = require('express')
, app = express()
, fs = require('fs')
, ini = require('ini')
, versionChecker = require('../../lib/utils/version-checker')
, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'));

exports.index = function(req, res, next){	
	var allThemes = new Array()
	, availableLanguages = []
	, availablethemes = fs.readdirSync('./public/themes/')
	, availableTranslations = fs.readdirSync('./public/translations/');
	

	availablethemes.forEach(function(file){
		allThemes.push(file);
	});
		
	availableTranslations.forEach(function(file){
		if (file.match('translation')){
			var languageCode = file.replace(/translation_|.json/g,"")
			availableLanguages.push(languageCode);
		}
	});

    binaryTypes = ['packaged','local'];

	res.render('settings',{
		movielocation: config.moviepath,
		selectedTheme: config.theme,
		musiclocation : config.musicpath,
		tvlocation : config.tvpath,
		localIP : config.localIP,
        selectedBinaryType : config.binaries,
        binaryTypes : binaryTypes,
		remotePort : config.remotePort,
		language: config.language,
		availableLanguages: availableLanguages,
		location: config.location,
		screensaver: config.screensaver,
		spotifyUser: config.spotifyUser,
		spotifyPass: config.spotifyPass,
		themes:allThemes,
		port: config.port,
		oauth: config.oauth,
		oauthKey: config.oauthKey
	});		
};
exports.get = function(req, res, next) {
	var infoRequest = req.params.id
	, optionalParam = req.params.optionalParam
	, action = req.params.action;
	
	switch(infoRequest) {
		case 'getToken':
			var token = config.oauth;
			if(!token) {
				res.json({message: 'No token'}, 500);
			}
			res.json({token: token});
		break;
		case 'checkForUpdate':
        	versionChecker.checkVersion(req, res);
		break;
		case 'doUpdate':
            fs.openSync('./configuration/update.js', 'w');
		break;
	}
};

