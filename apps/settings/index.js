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
, fs = require('fs');

var configfile = []
,configfilepath = './configuration/setup.js'
,configfile = fs.readFileSync(configfilepath)
,configfileResults = JSON.parse(configfile);

exports.index = function(req, res, next){	
	var allThemes = new Array();
	
	fs.readdir('./public/themes/',function(err,files){
		if (err){
			console.log('Could not get themes',err .red);
		}else{
			files.forEach(function(file){
				allThemes.push(file);
			});

			res.render('settings',{
				movielocation: configfileResults.moviepath,
				selectedTheme: configfileResults.theme,
				musiclocation : configfileResults.musicpath,
				tvlocation : configfileResults.tvpath,
				highres: configfileResults.highres,
				language: configfileResults.language,
				onscreenkeyboard: configfileResults.onscreenkeyboard,
				location: configfileResults.location,
				screensaver: configfileResults.screensaver,
				themes:allThemes,
				port: configfileResults.port
			});	
			
		}	
	});
};