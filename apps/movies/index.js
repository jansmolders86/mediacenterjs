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
, functions = require('./movie-functions');

exports.index = function(req, res, next){	
	res.render('movies',{
		selectedTheme: config.theme,
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
			case('loadItems'):
				functions.loadItems(req,res);
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

