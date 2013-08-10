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

// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
exports.engine = 'jade';

// Modules
var Spotify = require('spotify')
, spotifyPlay = require('spotify-web')
, lame = require('lame')
, Speaker = require('speaker')
, express = require('express')
, app = express()
, fs = require('fs')
, ini = require('ini')
, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'))
, username = config.spotifyUser
, password = config.spotifyPass
, functions = require('./spotify-functions');

// Render the indexpage
exports.index = function(req, res, next){
	res.render('spotify');
};

exports.get = function(req, res, next){	
	var infoRequest = req.params.id
	, optionalParam = req.params.optionalParam
	, action = req.params.action;
	
	if(!action){
		switch(optionalParam) {
			case('play'):
				functions.playTrack(req, res, infoRequest);
			break;
			case('info'):
				functions.getInfo(req, res, infoRequest);
			break;
			case('album'):
				functions.getAlbum(req, res, infoRequest);
			break;	
			default:
				return;
			break;	
		}
	} else if (!optionalParam){
		//Do nothing
		return;
	} else if(action === 'play') {
		playMovie(req, res, movieRequest);
	};
}



