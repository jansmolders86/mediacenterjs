/* Global Imports */
var moviedb = require('moviedb')('7983694ec277523c31ff1212e35e5fa3'),
	fs = require('fs'),
	os = require('os'),
	app_cache_handler = require('../../lib/handlers/app-cache-handler'),
	config = require('../../lib/handlers/configuration-handler').getConfiguration(),
	movie_title_cleaner = require('../../lib/utils/title-cleaner');

/* Variables */
// Init Database
var dblite = require('dblite')
if(os.platform() === 'win32'){
	dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');
db.on('info', function (text) { console.log(text) });
db.on('error', function (err) { console.error('Database error: ' + err) });

/* Public Methods */

/**
 * Fetches the Metadata for the specified Movie from themoviedb.org.
 * @param movieTitle         The Title of the Movie
 * @param callback           The Callback
 */
exports.fetchMetadataForMovie = function(movieTitle, callback) {
	db.query("CREATE TABLE IF NOT EXISTS movies (local_name TEXT PRIMARY KEY,original_name VARCHAR, poster_path VARCHAR, backdrop_path VARCHAR, imdb_id INTEGER, rating VARCHAR, certification VARCHAR, genre VARCHAR, runtime VARCHAR, overview TEXT, cd_number TEXT, adult TEXT)");

	var originalTitle = movieTitle;
	var movieInfos = movie_title_cleaner.cleanupTitle(movieTitle);
	movieTitle = movieInfos.title;

	app_cache_handler.ensureCacheDirExists('movies', movieTitle);
	loadMetadataFromDatabase(movieTitle, function (result) {
		if (result) {
			// Movie is already in the database.
			callback(result);
			return;
		}

		// New Movie. Fetch Metadata...
		fetchMetadataFromTheMovieDB(movieTitle, movieInfos.year, function(err, result) {
			if (err) {
				console.error(err);
				callback([]);
			}

			var poster_path = null;
			var backdrop_path = null;
            var adult = false;
			
			if(result !== null){
				poster_path = result.poster_path;
				backdrop_path = result.backdrop_path;
			}
			
			downloadMovieFanart(poster_path, backdrop_path, movieTitle, function(err) {
				var poster_path = '/movies/css/img/nodata.jpg';
				var backdrop_path = '/movies/css/img/backdrop.png';
				
				if (err) {
					console.error(err);
				} else {
					poster_path = app_cache_handler.getFrontendCachePath('movies', movieTitle, result.poster_path);
					backdrop_path = app_cache_handler.getFrontendCachePath('movies', movieTitle, result.backdrop_path);
				}

				var genre = 'Unknown';
				if(result !== null && result.genres.length){
					genre = result.genres[0].name;
				}
				var rating = 'Unknown',
					original_title = originalTitle,
					imdb_id = '',
					runtime = 'Unknown',
					overview = '',
					certification ='',
                    adult = 'false';
				 
				if(result !== null){
					rating = result.vote_average.toString();
					original_title = originalTitle;
					imdb_id = result.imdb_id;
					runtime = result.runtime;
					overview = result.overview;
                    var adultRating = result.adult;
                    adult = adultRating.toString();
				}
				
				var metadata = [ movieTitle, original_title, poster_path.replace(/\\/g,"/"), backdrop_path.replace(/\\/g,"/"), imdb_id, rating, certification, genre, runtime, overview, movieInfos.cd, adult ];
				storeMetadataInDatabase(metadata, function() {
                    console.log('data stored in database!');
					loadMetadataFromDatabase(movieTitle, callback);
				});
			});
		});
	});
};

/* Private Methods */

loadMetadataFromDatabase = function(movieTitle, callback) {
	db.query('SELECT * FROM movies WHERE local_name =? ', [ movieTitle ], {
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
				console.log('found info for movie' .green);
				console.log(rows)
				callback(rows);
			} else {
				console.log('new movie' .green);
				callback(null);
			}
		}
	);
};

storeMetadataInDatabase = function(metadata, callback) {
	db.query('INSERT OR REPLACE INTO movies VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', metadata);
	callback();
};

fetchMetadataFromTheMovieDB = function(movieTitle, year, callback) {
	moviedb.searchMovie({ query: movieTitle, language: config.language, year: year }, function(err, result) {
		if (err || (result && result.results.length < 1)) {
			console.error(err);
			callback(err, null);
		}else {
			console.log('Scraper found data for movie', movieTitle, result.results[0])
			moviedb.movieInfo({ id: result.results[0].id }, function(err, response) {
				callback(err, response);
			});
		}
	});
};

downloadMovieFanart = function(poster_path, backdrop_path, movieTitle, callback) {
	if (poster_path && backdrop_path) {
		var path = require('path');

        var baseUrl = 'http://image.tmdb.org'
		var poster_size = "/t/p/w342"
        var backdrop_size = "/t/p/w1920";

        var poster_url = baseUrl+poster_size
        var backdrop_url = baseUrl+backdrop_size

		try {
			app_cache_handler.downloadDataToCache('movies', movieTitle, poster_url + poster_path, function(err) {
				if (err) callback(err);
				app_cache_handler.downloadDataToCache('movies', movieTitle, backdrop_url + backdrop_path, function(err) {
					if (err) {
						callback(err);
					} else {
						callback(null);
					}
				});
			});
		} catch (exception) {
			callback(exception);
		}
	} else {
		callback('No Poster or Backdrop specified!');
	}
};
