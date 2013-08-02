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
, songStream
, username = config.spotifyUser
, password = config.spotifyPass

// Render the indexpage
exports.index = function(req, res, next){
	res.render('spotify');
};

exports.post = function(req, res, next){
	var incommingPost = req.body.post	
	Spotify.search({ type: 'track', query: incommingPost }, function(err, data) {
		if ( err ) {
			console.log('Error occurred: ' + err);
			return;
		} else {
			res.send(data);
		}
	});
};

exports.play = function(req, res, next){
	var uri = req.params.filename;
	switch( uri ) {
		/*case('stopPlaying'):
			console.log('Stopping song', songStream);
			songStreamon('onopen', function () {
				this.disconnect();
				this.close();
			});
		break;*/
		default:
			spotifyPlay.login(username, password, function (err, result) {
				if (err) {
					console.log('Spotify error',err);
				} else {
					result.get(uri, function (err, track) {
						console.log('Playing: %s - %s', track.artist[0].name, track.name);

						songStream = result
						
						track.play()
							.pipe(new lame.Decoder())
							.pipe(new Speaker())
							.on('finish', function () {
								result.disconnect();
							});
					});
				}
			  });
		break;	
	}
};


exports.album = function(req, res, next){
	var uri = req.params.album
	, username = config.spotifyUser
	, password = config.spotifyPass;

	spotifyPlay.login(username, password, function (err, result) {
		if (err) {
			console.log('Spotify error',err);
		} else {
			console.log('Album Art URIs for "%s - %s"', album.artist[0].name, album.name);

			album.cover.forEach(function (image) {
				console.log('%s: %s', image.size, image.uri);
			});
		}
	});
};









