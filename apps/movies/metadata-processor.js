var moviedb = require('moviedb')('7983694ec277523c31ff1212e35e5fa3');
var movie_title_cleaner = require('../../lib/utils/title-cleaner');
var config = config = require('../../lib/handlers/configuration-handler').getConfiguration();
var path = require('path');

exports.valid_filetypes = /(avi|mkv|mpeg|mov|mp4|m4v|wmv)$/gi;

exports.processFile = function (fileObject, callback) {
    var originalTitle = path.basename(fileObject.file);
    var movieInfo = movie_title_cleaner.cleanupTitle(originalTitle);
    var movieTitle = movieInfo.title.replace(this.valid_filetypes, '').trimRight();
    var searchOptions = { query: movieTitle,
                          language: config.language,
                          year: movieInfo.year };

    moviedb.searchMovie(searchOptions, function(err, result) {
        if (err || (result && result.results.length < 1)) {
            console.log('Error retrieving data for ' + movieTitle, err);
            callback();
        } else {
            result = result.results[0];
            if (!result) callback();

            var baseUrl = 'http://image.tmdb.org'
                , posterURL = result.poster_path ? baseUrl + '/t/p/w342' + result.poster_path : '/movies/css/img/nodata.jpg'
                , backgroundURL = result.backdrop_path ? baseUrl + '/t/p/w1920' + result.backdrop_path : '/movies/css/img/backdrop.jpg';

            var metadata = {
                filePath        : path.normalize(fileObject.href),
                title           : result.title ? result.title : movieTitle,
                posterURL       : posterURL,
                backgroundURL   : backgroundURL,
                imdbID          : result.imdb_id,
                rating          : result.vote_average ? result.vote_average.toString() : 'Unknown',
                genre           : result.genres && result.genres.length ? result.genres[0].name : 'Unknown',
                runtime         : result.runtime ? result.runtime : 'Unknown',
                overview        : result.overview,
                adult           : result.adult ? result.adult : false,
                hidden          : "false",
                year            : result.release_date ? new Date(result.release_date).getFullYear() : movieInfo.year
            };
            
            Movie.find({ filePath: metadata.filePath }).complete(function (err, movie) {
                if (err || !movie) {
                    Movie.create(metadata).success(function(err, movie) {
                        callback();
                    });
                } else {
                    movie.updateAttributes(metadata);
                    callback();
                }
            });
        }
    });
}