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

/* Modules */
var express = require('express')
, app = express()
, fs = require('fs.extra')
, ini = require('ini')
, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'))
, helper = require('../../lib/helpers.js')
, functions = require('./movie-functions');

exports.index = function(req, res, next){	
	var dir = config.moviepath
	, suffix = new RegExp("\.(avi|mkv|mpeg|mov|mp4)","g");

	helper.getLocalFiles(req, res, dir, suffix, function(err,files){
		var unique = {}, 
		movies = [];
		for(var i = 0, l = files.length; i < l; ++i){
			var movieFiles = files[i].file;
			var movieTitles = movieFiles.substring(movieFiles.lastIndexOf("/")).replace(/^\/|\/$/g, '');
			
			// filter movies on unique title
			if(unique.hasOwnProperty(movieTitles)) {
				continue;
			}
			
			//single
			if(movieTitles === '' && files[i].file !== undefined){
				movieTitles = files[i].file;
			}
			
			movies.push(movieTitles);
			unique[movieTitles] = 1;
		};
		
		res.render('movies',{
			movies: movies,
			selectedTheme: config.theme,
		});
	});
	
	
};

exports.get = function(req, res, next){	
	var infoRequest = req.params.id
	, optionalParam = req.params.optionalParam
	, action = req.params.action
	, platform = 'browser';
	
	if(infoRequest === 'filter'){
		functions.filter(req, res, optionalParam);
	} else if (optionalParam === undefined){
		switch(infoRequest) {
			case('getGenres'):
				functions.getGenres(req, res);
			break;
			case('filter'):
				functions.getGenres(req, res);
			break;
			default:
				return;
			break;		
		}	
	}
	
	if(!action){
		switch(optionalParam) {
			case('play'):
				functions.playMovie(req, res, platform, infoRequest);
			break;
			case('info'):
				functions.handler(req, res, infoRequest);
			break;	
			default:
				//Default
				return;
			break;		
		}
	} else if(action === 'ios') {
		platform = 'ios';
		functions.playMovie(req, res, platform, infoRequest);
	} else if(action === 'android') {
		platform = 'android';
		functions.playMovie(req, res, platform, infoRequest);
	} 

}

