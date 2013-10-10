/* Global Imports */
var dblite = require('dblite'),
	moviedb = require('moviedb')('7983694ec277523c31ff1212e35e5fa3'),
	fs = require('fs'),
	app_cache_handler = require('../../lib/handlers/app-cache-handler'),
	config = require('../../lib/handlers/configuration-handler').getConfiguration(),
	movie_title_cleaner = require('../../lib/utils/title-cleaner');

/* Variables */
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

			var poster_path = result.poster_path ? result.poster_path : null;
			var backdrop_path = result.backdrop_path ? result.backdrop_path : null;
			downloadMovieFanart(poster_path, backdrop_path, movieTitle, function(err) {
				var poster_path = '';
				var backdrop_path = '';
				if (err) {
					console.error(err);
				} else {
					poster_path = app_cache_handler.getFrontendCachePath('movies', movieTitle, result.poster_path);
					backdrop_path = app_cache_handler.getFrontendCachePath('movies', movieTitle, result.backdrop_path);
				}

				var genre = 'Unknown';
				if(result.genres.length){
					genre = result.genres[0].name;
				}

				var rating = result.vote_average.toString();
				var metadata = [ movieTitle, result.original_title, poster_path, backdrop_path, result.imdb_id,
								 rating, '', genre, result.runtime, result.overview, movieInfos.cd ];
				storeMetadataInDatabase(metadata, function() {
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
			cd_number  		: String
		},
		function(rows) {
			if (typeof rows !== 'undefined' && rows.length > 0){
				console.log('found info for movie' .green);
				callback(rows);
			} else {
				console.log('new movie' .green);
				callback(null);
			}
		}
	);
};

storeMetadataInDatabase = function(metadata, callback) {
	console.log('Writing data to table for', metadata[0] .green);
	db.query('INSERT OR REPLACE INTO movies VALUES(?,?,?,?,?,?,?,?,?,?,?)', metadata);
	callback();
};

fetchMetadataFromTheMovieDB = function(movieTitle, year, callback) {
	moviedb.searchMovie({ query: movieTitle, language: config.language, year: year }, function(err, result) {
		if (err) {
			console.error(err);
			callback(err, null);
		}

		moviedb.movieInfo({ id: result.results[0].id }, function(err, response) {
			callback(err, response);
		});
	});
};

downloadMovieFanart = function(poster_path, backdrop_path, movieTitle, callback) {
	if (poster_path && backdrop_path) {
		var path = require('path');

		var poster_url = "http://cf2.imgobject.com/t/p/w342",
			backdrop_url = "http://cf2.imgobject.com/t/p/w1920";

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
