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
var spotify = require('spotify')

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
	spotify.search({ type: 'track', query: searchQuery }, function(err, data) {
		if ( err ) {
			console.log('Error occurred: ' + err);
			return;
		} else {
			callback(data)
		}
	});
}

exports.play = function(req, res, next){
	var incommingUri = req.params.track
	var uri = process.argv[2] || incommingUri;
	var type = Spotify.uriType(uri);

	// initiate the Spotify session
	Spotify.login('test', 'passwrd', function (err, spotify) {
		if (err) throw err;

		// first get a "Track" instance from the track URI
		spotify.get(uri, function (err, track) {
			if (err) throw err;
			console.log('Playing: %s - %s', track.artist[0].name, track.name);
			
			var stat = fs.statSync(track)
			, start = 0
			, end = 0
			, range = req.header('Range');

			if (range != null) {
			start = parseInt(range.slice(range.indexOf('bytes=')+6,
				range.indexOf('-')));
			end = parseInt(range.slice(range.indexOf('-')+1,
				range.length));
			}
			if (isNaN(end) || end === 0) end = stat.size-1;
			if (start > end) return;

			res.writeHead(206, { // NOTE: a partial http response
				'Connection':'close',
				'Content-Type':'audio/mp3',
				'Content-Length':end - start,
				'Content-Range':'bytes '+start+'-'+end+'/'+stat.size,
				'Transfer-Encoding':'chunked'
			});
	
			var stream = fs.createReadStream(track);
			stream.pipe(res, function(err){
				if(err){
					console.log('error pipe', err)
				}
			});

		});
	});
};



