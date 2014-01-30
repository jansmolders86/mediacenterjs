/* Global Imports */
var fs = require('fs.extra')
	, file_utils = require('../../lib/utils/file-utils')
	, app_cache_handler = require('../../lib/handlers/app-cache-handler')
	, colors = require('colors')
	, os = require('os')
	, config = require('../../lib/handlers/configuration-handler').getConfiguration();

/* Constants */
var SUPPORTED_FILETYPES = new RegExp("(avi|mkv|mpeg|mov|mp4|wmv)$","g");

var dblite = require('dblite')
if(os.platform() === 'win32'){
    dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');
db.on('info', function (text) { console.log(text) });
db.on('error', function (err) { console.error('Database error: ' + err) });

//Create tables
db.query("CREATE TABLE IF NOT EXISTS tvshows (localName TEXT PRIMARY KEY,title VARCHAR,banner VARCHAR, genre VARCHAR, certification VARCHAR)");
db.query("CREATE TABLE IF NOT EXISTS progressionmarker (title TEXT PRIMARY KEY, progression TEXT, transcodingstatus TEXT)");

exports.loadItems = function (req, res){
	file_utils.getLocalFiles(config.tvpath, SUPPORTED_FILETYPES, function(err, files) {

        console.log('files', files);

		var tvShows = [];
		for(var i = 0, l = files.length; i < l; ++i){
			var tvShowFiles = files[i].file;
			var tvShowTitles = tvShowFiles.substring(tvShowFiles.lastIndexOf("/")).replace(/^\/|\/$/g, '');

			//single
			if(tvShowTitles === '' && files[i].file !== undefined){
				tvShowTitles = files[i].file;
			}

			tvShows.push(tvShowTitles.split("/").pop());
		}

		res.json(tvShows);
	});
};

exports.playtvShow = function (req, res, platform, tvShowRequest){
 
	file_utils.getLocalFile(config.tvpath, tvShowRequest, function(err, file) {
		if (err) console.log(err .red);
		if (file) {
			var tvShowUrl = file.href
			, tvShow_playback_handler = require('./tv-playback-handler');
			
			tvShow_playback_handler.startPlayback(res, tvShowUrl, tvShowRequest, platform);
    
		} else {
			console.log("File " + tvShowRequest + " could not be found!" .red);
		}
	});

};

exports.handler = function (req, res, tvShowRequest){
	//Modules
	var downloader = require('downloader');

	console.log('Searching for ' + tvShowRequest + ' in database');
    var metadata_fetcher = require('./metadata-fetcher');
	metadata_fetcher.fetchMetadataForTvShow(tvShowRequest, function(metadata) {
		res.json(metadata);
	});
};

exports.sendState = function (req, res){
    var incommingData = req.body
    , tvShowTitle = incommingData.tvShowTitle
    , progression = incommingData.currentTime
    , transcodingstatus = 'pending';

    db.query('INSERT OR REPLACE INTO progressionmarker VALUES(?,?,?)', [tvShowTitle, progression, transcodingstatus]);
};

