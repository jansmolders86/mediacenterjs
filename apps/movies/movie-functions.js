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
    , ProgressionMarker = dbSchema.ProgressionMarker
    , io = require('../../lib/utils/setup-socket').io
    , async = require('async');



function iterateSources(iterateFn) {
    fs.readdirSync(__dirname + "/sources").forEach(function(file) {
           try {
            var source = require("./sources/" + file);
            var settings;
            try {
                settings = JSON.parse(fs.readFileSync(__dirname + "/sources/" + file + "/settings.json"));
                console.log(settings);
            } catch (err) {
                settings = {};
            }
            source.settings = settings;
            iterateFn(source);
        } catch (err) {}
    });
}



exports.loadItems = function (req, res){

    getMovies(function (movies) {
        if (!movies) {
            var parallelFunctions = [];
            iterateSources(function (source) {
                if (source.retrieveMovies) {
                    parallelFunctions.push(function (callback) {
                        console.log("Getting movies for ", source.serviceName);
                        source.retrieveMovies(function (movies) {
                            if (!movies || movies.length == 0) {
                                console.log("No movies for", source.serviceName);
                                callback();
                            } else {
                                Movie.bulkCreate(movies)
                                .complete(function() {
                                    console.log("Done");
                                    callback();
                                });
                            }
                        }, source.settings);
                    });
                }
            });




            async.parallel(parallelFunctions,
            function() {
                metafetcher.loadData(function (percent) {
                     io.sockets.emit('progress',{msg:percent});
                },
                function (err) {
                    if (err) {
                        res.status(404).send();
                    } else {
                        io.sockets.emit('serverStatus',{msg:'Processing data...'});
                        getMovies(function (movies) {
                            if (!movies) {
                                res.status(500).send();
                            } else {
                                res.json(movies);
                            }
                        });
                    }
                });
            });
        } else {
            res.json(movies);
        }
    });
};
exports.sources = {};
exports.sources.style = function (req, res) {
    var allcss = "";
    var buffers = [];
    fs.readdirSync(__dirname + "/sources").forEach(function(file) {
        var cssPath = __dirname + "/sources/" + file + "/style.css";
        var css = null;
        try {
            css = fs.readFileSync(cssPath);
        } catch (err) {}
        if (css) {
            buffers.push(css);
            buffers.push(new Buffer("\n"));
        }
    });
    var finalBuffer = Buffer.concat(buffers);
    res.status(200).type('text/css').send(finalBuffer);
}
exports.sources.load = function (req, res) {
    var sources = [];
    iterateSources(function (source) {
        if (source.retrieveMovies) {
            var sourceData = {
                serviceName : source.serviceName,
                requiredSettings : source.requiredSettings,
                settings : source.settings
            };
            sources.push(sourceData);
        }
    });
    res.json(sources);
}
exports.sources.settings = function (req, res, service) {
    console.log("BODY:", req.body);
fs.writeFile(__dirname  + '/sources/' + service + '/settings.json', JSON.stringify(req.body), function(err) {
    if(err) {
      console.log(err);
      res.status(500).send();
    } else {
      console.log("Service settings saved");
      res.status(200).send();
    }
});
}


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
                console.log("File " + movieTitle + " could not be found!" .red);
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


/** Private functions **/
getMovies = function(callback){
    Movie.findAll().complete(function(err, movies) {
        if(err){
            callback(null);
        } else if (movies !== null && movies !== undefined && movies.length > 0){
            callback(movies);
        } else {
            callback(null);
        }
    });
}



