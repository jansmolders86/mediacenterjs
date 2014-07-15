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
    socket = require('../../lib/utils/setup-socket'),
    io = socket.io;


/* Constants */
var SUPPORTED_FILETYPES = new RegExp("(avi|mkv|mpeg|mov|mp4|wmv)$","g");  //Pipe seperated
var start = new Date();
var nrScanned = 0;
var totalFiles = 0;
var remaining;

/* Variables */
// Init Database
var database = require('../../lib/utils/database-connection');
var db = database.db;

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

var setupParse = function(req, res, serveToFrontEnd, results) {
    if (results && results.length > 0) {
        var file = results.pop();
        doParse(req, res, file, serveToFrontEnd, function() {
            setupParse(req, res, serveToFrontEnd, results);
        });
    }
    if (!results) {
        console.log('no results!');
    }
};


var doParse = function(req, res, file, serveToFrontEnd, callback) {
    var incommingTitle      = file.split('/').pop()
        , originalTitle     = incommingTitle
        , movieInfo         = movie_title_cleaner.cleanupTitle(incommingTitle)
        , newCleanTitle     = movieInfo.title
        , NewMovieTitle     = newCleanTitle.replace(/(avi|mkv|mpeg|mpg|mov|mp4|wmv)$/,"")
        , movieTitle        = NewMovieTitle.trimRight();


    getMetadataFromTheMovieDB(movieTitle, movieInfo.year, function(result) {
        var rating          = 'Unknown',
            original_name   = originalTitle,
            imdb_id         = '',
            runtime         = 'Unknown',
            overview        = '',
            poster_url      = '/movies/css/img/nodata.jpg',
            backdrop_url    = '/movies/css/img/backdrop.png',
            certification   ='',
            adult           = false,
            genre           = 'Unknown',
            baseUrl         = 'http://image.tmdb.org',
            poster_size     = "/t/p/w342",
            backdrop_size   = "/t/p/w1920";;

        if(result !== null){
            poster_url      = baseUrl+poster_size+result.poster_path
            backdrop_url    = baseUrl+backdrop_size+result.backdrop_path
            rating          = result.vote_average.toString();
            movieTitle      = result.title
            original_name   = originalTitle;
            imdb_id         = result.imdb_id;
            runtime         = result.runtime;
            overview        = result.overview;
            if(result.genres.length){
                genre = result.genres[0].name;
            }
            var adultRating = result.adult;
            adult = adultRating.toString();

            var metadata = [
                original_name,
                movieTitle,
                poster_url,
                backdrop_url,
                imdb_id,
                rating,
                certification,
                genre,
                runtime,
                overview,
                movieInfo.cd,
                adult
            ];
        }


        storeMetadataInDatabase(metadata, function(){
            nrScanned++;

            var perc = parseInt((nrScanned / totalFiles) * 100);
            var increment = new Date(), difference = increment - start;
            if (perc > 0) {
                var total = (difference / perc) * 100, eta = total - difference;
                io.sockets.emit('progress',{msg:perc});
                console.log(perc+'% done');
            }

            if(nrScanned === totalFiles){
                if(serveToFrontEnd === true){
                    io.sockets.emit('serverStatus',{msg:'Processing data...'});
                    getMovies(req, res);
                }
            }
            callback();

        });
    });
};


/* Private Methods */


storeMetadataInDatabase = function(metadata, callback) {
    db.query('INSERT OR REPLACE INTO movies VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', metadata);
    callback();
};

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

getMovies = function(req, res){
    db.query('SELECT * FROM movies ORDER BY title asc',{
        original_name       : String,
        title               : String,
        poster_path         : String,
        backdrop_path       : String,
        imdb_id             : String,
        rating              : String,
        certification       : String,
        genre               : String,
        runtime             : String,
        overview            : String,
        cd_number           : String,
        adult               : String
    },
     function(err, rows) {
         if(err){
             console.log("DB error",err);
         } else if (rows !== null && rows.length > 0){
             console.log('Sending data to client...');
             res.json(rows);
            // db.close();
         }
     });
}


exports.loadData = function(req, res, serveToFrontEnd) {
    nrScanned = 0;
    walk(dir,  function(err, results) {
        totalFiles = (results) ? results.length : 0;
        setupParse(req, res, serveToFrontEnd, results);
    });
}






/*
    **
    ** Get Data from Trakt instead of TheMovieDB
    ** Currently, not used. but probably will be in the near future
    **
    getMetadataFromTrakt(movieTitle,function(result) {
        var rating = 'Unknown',
            original_name = originalTitle,
            imdb_id = '',
            runtime = 'Unknown',
            overview = '',
            poster_url = '/movies/css/img/nodata.jpg',
            backdrop_url = '/movies/css/img/backdrop.png',
            certification ='',
            adult = false,
            genre = 'Unknown';

        if(result !== null){
            poster_url      = result.images.poster
            backdrop_url    = result.images.fanart;
            rating          = result.ratings.percentage;
            rating             = result.vote_average.toString();
            movieTitle      = result.title
            original_name   = originalTitle;
            imdb_id         = result.imdb_id;
            runtime         = result.runtime;
            certification   = result.certification;
            overview        = result.overview;
            if(result.genres.length){
                genre       = result.genres[0];
            }
            var adultRating = result.adult;
            adult = adultRating.toString();

            var metadata = [
                original_name,
                movieTitle,
                poster_url,
                backdrop_url,
                imdb_id,
                rating,
                certification,
                genre,
                runtime,
                overview,
                movieInfo.cd,
                adult
            ];
        }
*/
