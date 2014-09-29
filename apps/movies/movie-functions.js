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
var fs = require('fs.extra')
    , file_utils = require('../../lib/utils/file-utils')
    , app_cache_handler = require('../../lib/handlers/app-cache-handler')
    , colors = require('colors')
    , metafetcher = require('../movies/movie-metadata.js')
    , config = require('../../lib/handlers/configuration-handler').getConfiguration()
    , playback_handler = require('../../lib/handlers/playback')
    , dbSchema = require('../../lib/utils/database-schema')
    , Movie = dbSchema.Movie
    , ProgressionMarker = dbSchema.ProgressionMarker;


exports.loadItems = function (req, res, serveToFrontEnd) {
	function getMovies(nomoviesCallback) {
		Movie.findAll()
		.error(function (err) {
			res.status(500).send();
		})
		.success(function (movies) {
			if (movies === null || movies.length === 0) {
				nomoviesCallback();
			} else {
				if (serveToFrontEnd) {
					res.json(movies);
				}
			}
		});
	}
	getMovies(function () {
		metafetcher.loadData(function () {
			getMovies(function () {
				res.status(500).send();
			});
		});
	});
};

exports.edit = function(req, res, data) {
    Movie.find(data.id)
    .success(function(movie) {
        movie.updateAttributes(data)
        .success(function() {res.status(200).send();})
        .error(function(err) {res.status(500).send();});
    })
    .error(function(err) {res.status(404).send();});
}

exports.update = function(req, res, data) {
    Movie.find(data.id).success(function(movie) {
        metafetcher.updateMetadataOfMovie(movie, function(err, updMovie) {
            if (err) {
                res.status(500).send();
            } else {
                res.status(200).json(updMovie);
            }
        });
    })
    .error(function(err) {res.status(404).send();});
}

exports.playFile = function (req, res, platform, id){
    Movie.find(id)
    .success(function(movie) {
        file_utils.getLocalFile(config.moviepath, movie.originalName, function(err, file) {
            if (err){
                console.log('File not found',err .red);
                res.status(404).send();
            }
            if (file) {
                var movieUrl = file.href;

                var subtitleUrl = movieUrl;
                subtitleUrl = subtitleUrl.split(".");
                subtitleUrl = subtitleUrl[0]+".srt";

                var subtitleTitle = movie.originalName;
                subtitleTitle = subtitleTitle.split(".");
                subtitleTitle = subtitleTitle[0]+".srt";

                var type = 'movies';

                playback_handler.startPlayback(res, platform, movie.id, movieUrl, movie.originalName, subtitleUrl, subtitleTitle, type);

            } else {
                console.log("File " + movie.title + " could not be found!" .red);
                res.status(404).send();
            }
        });
    });
};


exports.progress = function (req, res){
    var data = req.body;
    ProgressionMarker.findOrCreate({MovieId : data.id},
        {MovieId: data.id})
    .success(function (progressionmarker) {
        progressionmarker.updateAttributes({
            progression         : data.progression,
            transcodingStatus   : 'pending'
        })
        .success(function() {
            res.status(200).send();
        })
        .error(function(err) {
            res.status(500).send();
        });
    })
    .error(function(err) {
        res.status(500).send();
    });
}
