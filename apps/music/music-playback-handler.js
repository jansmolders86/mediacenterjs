/*
	MediaCenterJS - A NodeJS based mediacenter solution
	
    Copyright (C) 2014 - Jan Smolders

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
/* Global imports */
var colors = require('colors'),
	fs = require('fs.extra'),
    os = require('os'),
	Encoder = require('node-html-encoder').Encoder,
	encoder = new Encoder('entity'),
	config = require('../../lib/handlers/configuration-handler').getConfiguration(),
	file_utils = require('../../lib/utils/file-utils'),
    Track = require('../../lib/utils/database-schema').Track;

/* Public Methods */
/**
 * Starts the playback of the provided track.
 * @param response              The HTTP-Response
 * @param albumTitle            The album title
 * @param trackName             The name of the track
 */
exports.startTrackPlayback = function(response, trackid) {
    getFilePathOfTrackInAlbum(trackid, function(fileUrl) {
        if (fileUrl) {
            startTrackStreaming(response, fileUrl);
        } else {
            console.error('Could not find file ' + fileUrl);
        }
    });
};

/* Private Methods */

startTrackStreaming = function(response, playbackPath) {
	var fileStat = fs.statSync(playbackPath),
		start = 0,
		end = fileStat.size - 1;

	console.log('Playing track:', playbackPath .green);

	response.writeHead(200, {
		'Connection': 'close',
		'Content-Type': 'audio/mp3',
		'Content-Length': end - start,
		'Content-Range': 'bytes ' + start + '-' + end + '/' + fileStat.size
	});

	var stream = fs.createReadStream(playbackPath);
	stream.pipe(response);
};

getFilePathOfTrackInAlbum = function(trackid, callback) {
    Track.find(trackid)
    .success(function (track) {
        callback(track.filePath);
    })
    .error(function (err) {
        callback(null);
    });
};
