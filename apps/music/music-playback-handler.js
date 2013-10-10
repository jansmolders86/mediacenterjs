/* Global imports */
var colors = require('colors'),
	fs = require('fs.extra'),
	Encoder = require('node-html-encoder').Encoder,
	encoder = new Encoder('entity'),
	config = require('../../lib/handlers/configuration-handler').getConfiguration(),
	file_utils = require('../../lib/utils/file-utils');

/* Public Methods */

/**
 * Starts the playback of the provided track.
 * @param response              The HTTP-Response
 * @param albumTitle            The album title
 * @param trackName             The name of the track
 */
exports.startTrackPlayback = function(response, albumTitle, trackName) {
	// HTML-Decode albumTitle and trackName
	trackName = encoder.htmlDecode(trackName);
	albumTitle = encoder.htmlDecode(albumTitle);

	if (!albumTitle || albumTitle === 'none') {
		var playbackPath = config.musicpath + trackName;
		startTrackStreaming(response, playbackPath);
	}
	else if (albumTitle) {
		getFilePathOfTrackInAlbum(albumTitle, trackName, function(fileUrl) {
			if (fileUrl) {
				startTrackStreaming(response, fileUrl);
			}
			else {
				console.error('Could not find track ' + trackName + ' in album ' + albumTitle + '!');
			}
		})
	}
};

/* Private Methods */

startTrackStreaming = function(response, playbackPath) {
	var fileStat = fs.statSync(playbackPath),
		start = 0,
		end = fileStat.size - 1;

	console.log('Playing track:', playbackPath .green);

	response.writeHead(206, {
		'Connection': 'close',
		'Content-Type': 'audio/mp3',
		'Content-Length': end - start,
		'Content-Range': 'bytes ' + start + '-' + end + '/' + fileStat.size,
		'Transfer-Encoding': 'chunked'
	});

	var stream = fs.createReadStream(playbackPath);
	stream.pipe(response);
};

getFilePathOfTrackInAlbum = function(albumTitle, trackName, callback) {
	var dir = config.musicpath + albumTitle + '/';
	var suffix = new RegExp("\.(mp3)","g");
	file_utils.getLocalFiles(dir, suffix, function(err, files) {
		if (err) callback(null);

		files.forEach(function(file) {
			if(file.file === trackName){
				callback(file.href);
			}
		});
	});
};
