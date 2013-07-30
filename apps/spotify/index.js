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
, lame = require('lame')
, express = require('express')
, app = express()
, fs = require('fs')
, ini = require('ini')
, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'));

// Render the indexpage
exports.index = function(req, res, next){
	res.render('spotify');
};

exports.post = function(req, res, next){
	var incomingFile = req.body
	, searchQuery = incomingFile.track

	findTrack(searchQuery, function(data){
		res.send(data)
	})
};


function findTrack(searchQuery, callback){
	Spotify.search({ type: 'track', query: searchQuery }, function(err, data) {
		if ( err ) {
			console.log('Error occurred: ' + err);
			return;
		} else {
			callback(data);
		}
	});
}


exports.play = function(req, res, next){
	var uri = req.params.filename
	
	var username = config.spotifyUser
	var password = config.spotifyPass
	
	spotifyLogin(username, password, uri);
};


function spotifyLogin(username, password, uri){
	Spotify.login(login.username, login.password, function (err, spotify) {
	  if (err) throw err;

	  // first get a "Track" instance from the track URI
	  spotify.get(uri, function (err, track) {
		if (err) throw err;
		console.log('Playing: %s - %s', track.artist[0].name, track.name);

		track.play()
		  .pipe(new lame.Decoder())
		  .on('finish', function () {
			spotify.disconnect();
		  });
	  });
	});
}



