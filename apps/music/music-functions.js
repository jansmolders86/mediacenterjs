var file_utils = require('../../lib/utils/file-utils')
    , os = require('os')
    , metafetcher = require('../../lib/utils/metadata-fetcher')
	, config = require('../../lib/handlers/configuration-handler').getConfiguration();

var metaType = "music";

// Init Database
var dblite = require('dblite')
if(os.platform() === 'win32'){
    dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');
db.on('info', function (text) { console.log(text) });
db.on('error', function (err) { console.error('Database error: ' + err) });

exports.loadItems = function(req, res){
    fetchData(req, res, metaType);
};

exports.getInfo = function(req, res, infoRequest) {
	var metadata_fetcher = require('./metadata-fetcher');
	var dblite = require('dblite');


    


	metadata_fetcher.fetchMetadataForAlbum(infoRequest, function(result) {
		res.json(result);
	});
};

exports.playTrack = function(req, res, albumTitle, trackName){
	var music_playback_handler = require('./music-playback-handler');

	music_playback_handler.startTrackPlayback(res, albumTitle, trackName);
};

/** Private functions **/

fetchData = function(req, res, metaType) {
    metafetcher.fetch(req, res, metaType, function(state){
        if(state === 'done'){
            db.query('SELECT * FROM music', {
                filename	: String,
                title		: String,
                cover		: String,
                year		: String,
                genre		: String,
                tracks		: JSON.parse
            },
            function(rows) {
                if (typeof rows !== 'undefined' && rows.length > 0){
                    console.log('found info for album' .green);
                    res.json(rows);
                } else {
                    console.log('Could not index any music, please check given music collection path');
                }
            });
        }
    });
};