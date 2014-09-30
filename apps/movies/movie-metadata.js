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
    Trakt = require('trakt'),
    app_cache_handler = require('../../lib/handlers/app-cache-handler'),
    configuration_handler = require('../../lib/handlers/configuration-handler'),
    config = configuration_handler.initializeConfiguration(),
    file_utils = require('../../lib/utils/file-utils'),
    movie_title_cleaner = require('../../lib/utils/title-cleaner'),
    io = require('../../lib/utils/setup-socket').io;


/* Constants */
var SUPPORTED_FILETYPES = new RegExp("(avi|mkv|mpeg|mov|mp4|wmv)$","g");  //Pipe seperated
var start = new Date();
var nrScanned = 0;
var totalFiles = 0;
var remaining;
var noResult = {
    "result":"none"
};

/* Variables */
// Init Database
var Movie = require('../../lib/utils/database-schema').Movie;

/* Public Methods */

var dir = path.resolve(config.moviepath);
var walk = function(dir, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
        if (err)
            return done(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file)
                return done(null, results);
            file = dir + '/' + file;
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    var ext = file.split(".");
                    ext = ext[ext.length - 1];
                    if (ext.match(SUPPORTED_FILETYPES)) {
                        results.push(file);
                    }
                    next();
                }
            });
        })();
    });
};

var setupParse = function(callback, results) {
    if (results.length == 0) {
        callback();
    }
    if (results && results.length > 0) {
        var file = results.pop();
        doParse(file, function() {
            setupParse(callback, results);
        });
    }
    if (!results) {
        callback('no results');
    }
};


function fillMovieFromTMDBResult(movie, result) {
    var baseUrl         = 'http://image.tmdb.org',
    poster_size     = "/t/p/w342",
    backdrop_size   = "/t/p/w1920";
    movie.posterURL      = baseUrl+poster_size+result.poster_path
    movie.backgroundURL  = baseUrl+backdrop_size+result.backdrop_path
    movie.rating         = result.vote_average.toString();
    movie.title          = result.title
    movie.imdbID         = result.imdb_id;
    movie.runtime        = result.runtime;
    movie.overview       = result.overview;
    if (result.genres.length) movie.genre = result.genres[0].name;
    movie.adult          = result.adult.toString();
}

var updateMetadataOfMovie = exports.updateMetadataOfMovie = function(movie, callback) {
    getMetadataFromTheMovieDB(movie.title, null, function (result) {
        if (result !== null) {
            fillMovieFromTMDBResult(movie, result);
            //must be full movie object...
            movie.save()
            .complete(function (err, updMovie) {
                callback(err, updMovie);
            });
        } else {
            callback("not found in tmbd");
        }
    });
}

var doParse = function(file, callback) {
    var incommingTitle      = file.split('/').pop()
        , originalTitle     = incommingTitle
        , movieInfo         = movie_title_cleaner.cleanupTitle(incommingTitle)
        , newCleanTitle     = movieInfo.title
        , NewMovieTitle     = newCleanTitle.replace(/(avi|mkv|mpeg|mpg|mov|mp4|wmv)$/,"")
        , movieTitle        = NewMovieTitle.trimRight();


    getMetadataFromTheMovieDB(movieTitle, movieInfo.year, function(result) {
        var metadata = {
            originalName    : originalTitle,
            title           : movieTitle,
            posterURL       : '/movies/css/img/nodata.jpg',
            backgroundURL   : '/movies/css/img/backdrop.png',
            imdbID          : null,
            rating          : 'Unknown',
            certification   : null,
            genre           : 'Unknown',
            runtime         : 'Unknown',
            overview        : null,
            cdNumber        : null,
            adult           : false,
            hidden          : "false"
        };

        if (result !== null) {
            fillMovieFromTMDBResult(metadata, result);
        }

        Movie.create(metadata).complete(function() {
            nrScanned++;

            var perc = parseInt((nrScanned / totalFiles) * 100);
            if (perc > 0) {
                io.sockets.emit('progress',{msg:perc});
                console.log(perc+'% done');
            }
            callback();
        });
    });
};


/* Private Methods */

getMetadataFromTheMovieDB = function(movieTitle, year, callback) {
    moviedb.searchMovie({ query: movieTitle, language: config.language, year: year }, function(err, result) {
        if (err || (result && result.results.length < 1)) {
            console.log('Error retrieving data',err);
            callback(null);
        }else {
            moviedb.movieInfo({ id: result.results[0].id }, function(err, response) {
                callback(response);
            });
        }
    });
};

getMetadataFromTrakt = function(movieTitle, callback) {
    var options = { query: movieTitle }
    , trakt = new Trakt({username: 'mediacenterjs', password: 'mediacenterjs'});
    trakt.request('search', 'movies', options, function(err, result) {
        if (err) {
            console.log('error retrieving tvshow info', err .red);
            callback(null);
        } else {
            var movieData = result[0];
            if (movieData !== undefined && movieData !== '' && movieData !== null) {
                callback(movieData);
            }
        }
    });
};


exports.loadData = function(callback) {
    nrScanned = 0;
    walk(dir,  function(err, results) {
        totalFiles = (results) ? results.length : 0;
        setupParse(callback, results);
    });
}
