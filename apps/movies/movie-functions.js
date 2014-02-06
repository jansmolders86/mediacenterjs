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

exports.loadItems = function (req, res){
	file_utils.getLocalFiles(config.moviepath, SUPPORTED_FILETYPES, function(err, files) {
 
		var movies = [];
		for(var i = 0, l = files.length; i < l; ++i){
			var movieFiles = files[i].file;
			var movieTitles = movieFiles.substring(movieFiles.lastIndexOf("/")).replace(/^\/|\/$/g, '');

			//single
			if(movieTitles === '' && files[i].file !== undefined){
				movieTitles = files[i].file;
			}

			movies.push(movieTitles.split("/").pop());
		}
		res.json(movies);
	});
};

exports.playMovie = function (req, res, platform, movieRequest){
 
	file_utils.getLocalFile(config.moviepath, movieRequest, function(err, file) {
		if (err) console.log(err .red);
		if (file) {
			var movieUrl = file.href
			, movie_playback_handler = require('./movie-playback-handler');
			
			movie_playback_handler.startPlayback(res, movieUrl, movieRequest, platform);
    
		} else {
			console.log("File " + movieRequest + " could not be found!" .red);
		}
	});

};

exports.handler = function (req, res, movieRequest){
	//Modules
	var downloader = require('downloader');
	var metadata_fetcher = require('./metadata-fetcher');

	console.log('Searching for ' + movieRequest + ' in database');
	metadata_fetcher.fetchMetadataForMovie(movieRequest, function(metadata) {
		res.json(metadata);
	});
};

exports.getGenres = function (req, res){
	db.query('SELECT genre FROM movies', function(rows) {
		if (typeof rows !== 'undefined' && rows.length > 0){
			var allGenres = rows[0][0].replace(/\r\n|\r|\n| /g,","),
				genreArray = allGenres.split(',');
			res.json(genreArray);
		}
	});
};

exports.filter = function (req, res, movieRequest){
	db.query('SELECT * FROM movies WHERE genre =?', [movieRequest], { local_name: String }, function(rows) {
		if (typeof rows !== 'undefined' && rows.length > 0) {
			res.json(rows);
		}
	});
};

exports.sendState = function (req, res){
    db.query("CREATE TABLE IF NOT EXISTS progressionmarker (movietitle TEXT PRIMARY KEY, progression TEXT, transcodingstatus TEXT)");

    var incommingData = req.body
    , movieTitle = incommingData.movieTitle
    , progression = incommingData.currentTime
    , transcodingstatus = 'pending';

    db.query('INSERT OR REPLACE INTO progressionmarker VALUES(?,?,?)', [movieTitle, progression, transcodingstatus]);
}

