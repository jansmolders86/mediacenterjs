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
    , io = require('../../lib/utils/setup-socket').io;


exports.loadItems = function (req, res){

    getMovies(function (movies) {
        if (!movies) {
            getNetlfixMyList(function() {
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



/** Netflix **/
//rather than a seperate web app
//(which would just be the netflix website anyway)
//add the my list into the movies list
//this wants to be plugin like, but this is just a PoC
//Also no way to seperate TV from Movies without 
//making more requests to netflix or metadata service
var request = require('request'),
    cheerio = require("cheerio");

request.defaults({
        maxRedirects:20,
        jar: request.jar()
    }),

getNetlfixMyList = exports.getNetlfixMyList = function(callback) {
    //from https://gist.github.com/wilson428/8312213#file-scrape-js-L52
    request("https://signup.netflix.com/Login", function(err, resp, body) {
        // cheerio parses the raw HTML of the response into a jQuery-like object for easy parsing
        var $ = cheerio.load(body);
 
        // we're specifically looking for an ID on the page we need to log in, which looks like this: 
        // <input type="hidden" name="authURL" value="1388775312720.+vRSN6us+IhZ1qOSlo8CyAS/ZJ4=">
        var data = {
            email: "EMAIL",
            password: "PASSWORD"
        }
        data.authURL = $("input[name='authURL']").attr("value");
 
        request.post("https://signup.netflix.com/Login", { form: data }, function(err, resp, body) {
            if (err) { throw err; }
            console.log("Successfully logged in.");
            //can only use the default profile :/ 
            //switching profile seems to rely on the netflix api
            //we have to request twice to get around profiles
            request("https://www2.netflix.com/MyList", function (err, resp, body) {
            request("http://www2.netflix.com/MyList", function(err, resp, body) {
                console.log("received mylist");
                var $ = cheerio.load(body);
                var mylistmovies = $(".list-items > .agMovie");
                var movieData = [];
                mylistmovies.each(function(i, mylistmovie) {
                    var a = cheerio(mylistmovie).find("span > a");
                    var img = cheerio(mylistmovie).find("span > img");
                    var data = {
                        videoURL : a.attr("href"),
                        title : img.attr("alt"),
                        serviceId : a.attr("data-uitrack").split(",")[0],
                        service: "netflix",
                        posterURL : img.attr("src")
                    };
                    movieData.push(data);
                });
                Movie.bulkCreate(movieData)
                .success(function() {
                    callback();    
                });
            });
            });
        });
    });
}







