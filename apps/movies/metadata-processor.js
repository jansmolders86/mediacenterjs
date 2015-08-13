var moviedb = require('moviedb')('1d0a02550b7d3eb40e4e8c47a3d8ffc6')
, movie_title_cleaner = require('../../lib/utils/title-cleaner')
, config = config = require('../../lib/handlers/configuration-handler').getConfiguration()
, path = require('path')
, logger = require('winston');

exports.valid_filetypes = /(avi|mkv|mpeg|mov|mp4|m4v|wmv)$/gi;

exports.processFile = function (fileObject, callback) {
    var originalTitle = path.basename(fileObject.file);
    var movieInfo = movie_title_cleaner.cleanupTitle(originalTitle);
    var movieTitle = movieInfo.title.replace(this.valid_filetypes, '').trimRight();
    var searchOptions = { query: movieTitle,
                          language: config.language,
                          year: movieInfo.year };

    var metadata = {
        filePath        : path.normalize(fileObject.href),
        title           : movieTitle,
        posterURL       : '/movies/css/img/nodata.jpg',
        backgroundURL   : '/movies/css/img/backdrop.jpg',
        imdbID          : 0,
        rating          : 'Unknown',
        genre           : 'Unknown',
        runtime         : 'Unknown',
        overview        : '',
        adult           : false,
        hidden          : 'false',
        year            : movieInfo.year
    };

    moviedb.searchMovie(searchOptions, function(err, result) {
        if (err || (result && result.results.length < 1)) {
            console.log('Error retrieving data for ' + movieTitle, err);
        } else {
            result = result.results[0];

            var posterURL = buildImageUrl('342', result.poster_path) || metadata.posterURL;
            var backgroundURL = buildImageUrl('1920', result.backdrop_path) || metadata.backgroundURL;

            metadata.title = result.title;
            metadata.posterURL = posterURL;
            metadata.backgroundURL = backgroundURL;
            metadata.imdbID = result.imdbID;
            metadata.rating = result.vote_average.toString();
            metadata.genre = result.genres && result.genres.length ? result.genres[0].name : metadata.genre;
            metadata.runtime = result.runtime || 'Unknown';
            metadata.overview = result.overview;
            metadata.adult = result.adult === 'true';
            metadata.year = result.release_date ? new Date(result.release_date).getFullYear() : metadata.year;
        }

        Movie.find({ where: { filePath: metadata.filePath } }).complete(function (err, movie) {
            if (err || !movie) {
                Movie.create(metadata).success(function(err, movie) {
                    callback();
                });
            } else {
                movie.updateAttributes(metadata);
                callback();
            }
        });
    });
}

function buildImageUrl(width, path) {
  if (!path) return;
  return "http://image.tmdb.org/t/p/w" + width + path;
}
