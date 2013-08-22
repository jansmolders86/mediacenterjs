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
	var writePath = './public/movies/data/movieindex.js'
	, getDir = false
	, dir = config.moviepath
	, fileTypes = new RegExp("\.(avi|mkv|mpeg|mov|mp4)","g");;

	helper.getLocalFiles(req, res, dir, writePath, getDir, fileTypes,  function(status){
		var moviefiles = []
		,moviefilepath = './public/movies/data/movieindex.js'
		,moviefiles = fs.readFileSync(moviefilepath)
		,moviefileResults = JSON.parse(moviefiles)	
		
		res.render('movies',{
			movies: moviefileResults,
			selectedTheme: config.theme,
			status:status
		});
	});
};

exports.get = function(req, res, next){	
	var infoRequest = req.params.id
	, optionalParam = req.params.optionalParam
	, action = req.params.action;

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
				functions.playMovie(req, res, infoRequest);
			break;
			case('info'):
				functions.handler(req, res, infoRequest);
			break;	
			default:
				//Default
				return;
			break;		
		}
	} else if(action === 'play') {
		playMovie(req, res, movieRequest);
	};

}

