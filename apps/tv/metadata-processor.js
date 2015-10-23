var moviedb = require('moviedb')('7983694ec277523c31ff1212e35e5fa3')
, episoder = require('../../lib/utils/episoder')
, tv_title_cleaner = require('../../lib/utils/title-cleaner')
, path = require('path')
, logger = require('winston')
, Promise = require("bluebird");

var writeSerialise = Promise.resolve();

exports.valid_filetypes = /(avi|mkv|mpeg|mov|mp4|m4v|wmv)$/gi;

exports.processFile = function (fileObject, callback) {
    var originalTitle           = path.basename(fileObject.file)
    , episodeInfo               = tv_title_cleaner.cleanupTitle(originalTitle)
    , episodeReturnedTitle      = episodeInfo.title
    , episodeStripped           = episodeReturnedTitle.replace(this.valid_filetypes, '')
    , episodeTitle              = episodeStripped.trimRight();

    // TODO: Make this more fault tolerant! Crashes in some cases when no
    // Show name could be found
    var episodeDetails = episoder.parseFilename(originalTitle);
    if (!episodeDetails) return callback();

    var trimmedTitle = episodeDetails.show;
    if (trimmedTitle !== undefined) {
        trimmedTitle = trimmedTitle.toLowerCase().trim();
    } else {
        trimmedTitle = 'Unknown show';
    }

    // Store episode data in db and do lookup again
    writeSerialise = writeSerialise.then(function () {
        return Episode.findOrCreate({where: { filePath: fileObject.href }, defaults: {
            filePath: path.normalize(fileObject.href),
            name: trimmedTitle,
            season: episodeDetails.season || 0,
            episode: episodeDetails.episode || 0
        }})
        .spread(function(episode, created) {
            var showData = {
                name            : trimmedTitle,
                posterURL       : '/tv/css/img/nodata.jpg',
                genre           : 'Unknown',
                certification   : 'Unknown'
            };
            moviedb.searchTv({query: trimmedTitle}, function(err, result) {
                if (err || (result && result.results.length < 1)) {
                    console.log('Error retrieving data for ' + trimmedTitle, err);
                } else {
                    result = result.results[0];

                    var baseUrl = 'http://image.tmdb.org';
                    var posterURL = result.poster_path ? baseUrl + '/t/p/w342' + result.poster_path : '/movies/css/img/nodata.jpg';

                    showData.posterURL = posterURL;
                    if (result.genres) {
                        showData.genre = result.genres.join(',');
                    }
                    if (result.certification) {
                        showData.certification = result.certification;
                    }
                    if (result.title) {
                        showData.name = result.title.toLowerCase();
                    }
                }

                writeSerialise = writeSerialise.then(function () {
                    return Show.findOrCreate({where: { name: showData.name }, defaults: showData})
                        .spread(function (show, created) {
                            return show.addEpisode(episode);
                        })
                        .then(function () {
                            callback();
                        });
                });
            });
        });
    });
}
