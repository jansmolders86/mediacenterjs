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
/* Global Imports */
var moviedb = require('moviedb')('7983694ec277523c31ff1212e35e5fa3'),
    fs = require('fs'),
    os = require('os'),
    path = require('path'),
    app_cache_handler = require('../../handlers/app-cache-handler'),
    configuration_handler = require('../../handlers/configuration-handler'),
    config = configuration_handler.initializeConfiguration(),
    file_utils = require('../../utils/file-utils'),
    movie_title_cleaner = require('../../utils/title-cleaner');


/* Constants */
var SUPPORTED_FILETYPES = new RegExp("(avi|mkv|mpeg|mov|mp4|wmv)$","g");
var totalFiles = 0;
var nrScanned = 0;
var start = new Date();
var remaining;

/* Variables */
// Init Database
var dblite = require('dblite')
if(os.platform() === 'win32'){
    dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');
db.on('info', function (text) { console.log(text) });
db.on('error', function (err) { console.error('Database error: ' + err) });

db.query("CREATE TABLE IF NOT EXISTS movies (original_name TEXT PRIMARY KEY, title TEXT, poster_path VARCHAR, backdrop_path VARCHAR, imdb_id INTEGER, rating VARCHAR, certification VARCHAR, genre VARCHAR, runtime VARCHAR, overview TEXT, cd_number TEXT, adult TEXT)");


/* Public Methods */

console.log('Meta gathering started: Movies');
var dir = path.resolve(config.moviepath);
file_utils.getLocalFiles(dir, SUPPORTED_FILETYPES, function(err, files) {
    totalFiles = files.length;
    if(files.length === 0){
        console.log('Could not index any movies, please check given movie collection path');
    }
    for(var i = 0, l = files.length; i < l; ++i){
        var movieFiles = files[i].file;
        var movieTitles = movieFiles.substring(movieFiles.lastIndexOf("/")).replace(/^\/|\/$/g, '');

        if(movieTitles === '' && files[i].file !== undefined){
            movieTitles = files[i].file;
        }

        var newMovie = movieTitles.split("/").pop();

        fetchMetadataForMovie(newMovie, function(metadata) {
            
            if(nrScanned === totalFiles){
                var stop = new Date();
                console.log("Scan complete! Time taken:", UMS((stop - start) / 100, true));
                db.close();                
                process.exit();
            }
        });
    }
});

/**
 * Fetches the Metadata for the specified Movie from themoviedb.org.
 * @param newMovieTitle         The Title of the Movie
 * @param callback           The Callback
 */
fetchMetadataForMovie = function(newMovieTitle, callback) {

    var originalTitle       = newMovieTitle
        , movieInfo         = movie_title_cleaner.cleanupTitle(newMovieTitle)
        , newCleanTitle     = movieInfo.title
        , NewMovieTitle     = newCleanTitle.replace(/(avi|mkv|mpeg|mpg|mov|mp4|wmv)$/,"")
        , movieTitle        = NewMovieTitle.trimRight();

    app_cache_handler.ensureCacheDirExists('movies', movieTitle);
    loadMetadataFromDatabase(movieTitle, function (result) {

           
        nrScanned++;  

        var perc = parseInt((nrScanned / totalFiles) * 100);
        var increment = new Date(), difference = increment - start;
        if (perc > 0) {
            var total = (difference / perc) * 100, eta = total - difference;
            console.log('Item '+nrScanned+' from '+totalFiles+', '+perc+'% done \r');
        }    
        
        
        if (result && result[0].poster_path !== '/movies/css/img/nodata.jpg' ) {
            // Movie is already in the database.
            return callback(result);
        }

        // New Movie. Fetch Metadata...
        fetchMetadataFromTheMovieDB(movieTitle, movieInfo.year, function(err, result) {
            if (err) {
                console.log('Error retrieving data',err);
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
                    console.log(err);
                } else {
                    poster_path = app_cache_handler.getFrontendCachePath('movies', movieTitle, result.poster_path);
                    backdrop_path = app_cache_handler.getFrontendCachePath('movies', movieTitle, result.backdrop_path);
                }

                var genre = 'Unknown';
                if(result !== null && result.genres.length){
                    genre = result.genres[0].name;
                }
                var rating = 'Unknown',
                    original_name = originalTitle,
                    imdb_id = '',
                    runtime = 'Unknown',
                    overview = '',
                    certification ='',
                    adult = 'false';

                if(result !== null){
                    rating = result.vote_average.toString();
                    original_name = originalTitle;
                    imdb_id = result.imdb_id;
                    runtime = result.runtime;
                    overview = result.overview;
                    var adultRating = result.adult;
                    adult = adultRating.toString();
                }

                var metadata = [ 
                    original_name, movieTitle,  
                    poster_path.replace(/\\/g,"/"), 
                    backdrop_path.replace(/\\/g,"/"), 
                    imdb_id, 
                    rating, 
                    certification, 
                    genre, 
                    runtime, 
                    overview, 
                    movieInfo.cd, 
                    adult 
                ];
     
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
    db.query("CREATE TABLE IF NOT EXISTS movies (original_name TEXT PRIMARY KEY, title TEXT, poster_path VARCHAR, backdrop_path VARCHAR, imdb_id INTEGER, rating VARCHAR, certification VARCHAR, genre VARCHAR, runtime VARCHAR, overview TEXT, cd_number TEXT, adult TEXT)");
    db.query('SELECT * FROM movies WHERE title =? ', [ movieTitle ], {
            original_name  	: String,
            title 		    : String,
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
                callback(rows);
            } else {
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
            console.log('Error retrieving data',err);
            callback(err, null);
        }else {
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

var UMS = function(seconds, ignoreZero) {
	var hours = parseInt(seconds / 3600), rest = parseInt(seconds % 3660), minutes = parseInt(rest / 60), seconds = parseInt(rest % 60);
	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	if (ignoreZero) {
		if (hours == "00") {
			hours = "";
		} else {
			hours = hours + ":";
		}
	} else {
		hours = hours + ":";
	}
	return hours + minutes + ":" + seconds;
};
