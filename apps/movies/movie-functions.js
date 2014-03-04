/* Global Imports */
var fs = require('fs.extra')
	, file_utils = require('../../lib/utils/file-utils')
	, app_cache_handler = require('../../lib/handlers/app-cache-handler')
	, colors = require('colors')
	, os = require('os')
    , metafetcher = require('../../lib/utils/metadata-fetcher')
	, config = require('../../lib/handlers/configuration-handler').getConfiguration();

var metaType = "movie";
var dblite = require('dblite')
if(os.platform() === 'win32'){
    dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');
db.on('info', function (text) { console.log(text) });
db.on('error', function (err) { console.error('Database error: ' + err) });

exports.fetchItems = function (req, res){
    metafetcher.fetch(metaType);
};

exports.loadItems = function (req, res){
    db.query('SELECT * FROM movies',{
            local_name 		: String,
            original_name  	: String,
            poster_path  	: String,
            backdrop_path  	: String,
            imdb_id  		: String,
            rating  		: String,
            certification  	: String,
            genre  			: String,
            runtime  		: String,
            overview  		: String,
            cd_number  		: String,
            adult           : String
        },
        function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){
                res.json(rows);
            } else {
                res.json(null);
                console.log('Running index');
                metafetcher.fetch(metaType);
            }
        }
    );
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

