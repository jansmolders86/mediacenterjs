/* Global Imports */
var dblite = require('dblite'),
	moviedb = require('moviedb')('7983694ec277523c31ff1212e35e5fa3'),
	fs = require('fs'),
	app_cache_handler = require('../../lib/handlers/app-cache-handler'),
	config = require('../../lib/handlers/configuration-handler').getConfiguration(),
	movie_title_cleaner = require('../../lib/utils/title-cleaner');

/* Variables */
dblite.bin = "./bin/sqlite3/sqlite3";
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
            
            var poster_path = '/movies/css/img/nodata.jpg'
                , backdrop_path = '/movies/css/img/backdrop.jpg';
            
            if(result !== null){
                poster_path = result.poster_path
                backdrop_path = result.backdrop_path
            }
            
			downloadMovieFanart(poster_path, backdrop_path, movieTitle, function(err) {
                
                var genre = 'Unknown'
                    , rating = 'Unknown'
                    , title = movieTitle
                    , imdb_id = 'Unknown'
                    , runtime = 'Unknown'
                    , overview = 'Unknown'
                    , certification = 'Unknown'
                
                
                if(result !== null){
                    rating = result.vote_average.toString();
                    title = result.original_title
                    imdb_id  = result.imdb_id
                    runtime = result.runtime
                    overview = result.overview
                    
                    if(result.genres.length){
                        genre = result.genres[0].name;
                    }
                }
                
                if(result !== null){
                   poster_path = app_cache_handler.getFrontendCachePath('movies', movieTitle, result.poster_path);
                   backdrop_path = app_cache_handler.getFrontendCachePath('movies', movieTitle, result.backdrop_path);
                }    

				var metadata = [ movieTitle, title, poster_path, backdrop_path, imdb_id, rating, certification, genre, runtime, overview, movieInfos.cd ];
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
    if(metadata !== null && metadata !== undefined){ 
	   console.log('Writing data to table for', metadata[0] .green);
	   db.query('INSERT OR REPLACE INTO movies VALUES(?,?,?,?,?,?,?,?,?,?,?)', metadata);
	   callback();
    }
};

fetchMetadataFromTheMovieDB = function(movieTitle, year, callback) {
	moviedb.searchMovie({ query: movieTitle, language: config.language, year: year }, function(err, result) {
		if (err) {
			console.error('Error downloading scraperdata',err);
			callback(err);
		}

        moviedb.movieInfo({ id: result.results[0].id }, function(err, response) {
            callback(err, response);
        });
	
	});
};

downloadMovieFanart = function(poster_path, backdrop_path, movieTitle, callback) {
	if (poster_path !== '/movies/css/img/nodata.jpg' && backdrop_path !== '/movies/css/img/backdrop.jpg') {
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
		callback('Falling back to defaults');
	}
};
