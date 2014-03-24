/* Global imports */
var colors = require('colors'),
	fs = require('fs.extra'),
    os = require('os'),
	Encoder = require('node-html-encoder').Encoder,
	encoder = new Encoder('entity'),
	config = require('../../lib/handlers/configuration-handler').getConfiguration(),
	file_utils = require('../../lib/utils/file-utils');

/* Public Methods */

// Init Database
var dblite = require('dblite')
if(os.platform() === 'win32'){
    dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');
db.on('info', function (text) { console.log(text) });
db.on('error', function (err) { console.error('Database error: ' + err) });

/**
 * Starts the playback of the provided track.
 * @param response              The HTTP-Response
 * @param albumTitle            The album title
 * @param trackName             The name of the track
 */
exports.startTrackPlayback = function(response, track) {
    getFilePathOfTrackInAlbum(track, function(fileUrl) {
        if (fileUrl) {
            startTrackStreaming(response, fileUrl);
        } else {
            console.error('Could not find track ' + trackName + ' in album ' + albumTitle + '!');
        }
    });
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

getFilePathOfTrackInAlbum = function(track, callback) {

    db.query('SELECT * FROM tracks WHERE filename =? ', [ track ], {
            track         	: String,
            album 		    : String,
            artist  	    : String,
            year            : String,
            filename        : String,
            filepath        : String
        },
        function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){
                callback(rows.filepath);
            } else {
                callback(null);
            }
        }
    );
};
