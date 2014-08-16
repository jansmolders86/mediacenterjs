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
    , Movie = require('../../lib/utils/database-schema').Movie;


exports.loadItems = function (req, res, serveToFrontEnd){
    var metaType = "movie";
    var getNewFiles = true;

    if(serveToFrontEnd === false){
        fetchMovieData(req, res, metaType, serveToFrontEnd);
    } else {
        serveToFrontEnd = true;
        getMovies(req, res, metaType, serveToFrontEnd,getNewFiles);
    }
};


exports.backdrops = function (req, res){
    Movie.all(function(err, movies) {
        if (err === null && movies !== null && movies !== undefined){
            var backdropArray = [];
            movies.forEach(function(item){
               var backdrop = item.backdropURL;
               backdropArray.push(backdrop)
            });
            res.json(backdropArray);
        }
    });
};

exports.edit = function(req, res, data){
    console.log("edit", data);
    var movie = new Movie(data);
    movie.save(function(err) {
        res.status(err ? 500 : 200).send();
    });
}

exports.update = function(req, res, data) {
    var movie = new Movie(data);
    metafetcher.updateMetadataOfMovie(movie, function (err, updMovie) {
        if (err) {
            res.status(404).send();
        } else {
            res.status(200).json(updMovie);
        }
    });
}

exports.playFile = function (req, res, platform, movieTitle){
    file_utils.getLocalFile(config.moviepath, movieTitle, function(err, file) {
        if (err){
            console.log('File not found',err .red);
        }
        if (file) {
            var movieUrl = file.href;

            var subtitleUrl = movieUrl;
            subtitleUrl = subtitleUrl.split(".");
            subtitleUrl = subtitleUrl[0]+".srt";

            var subtitleTitle = movieTitle;
            subtitleTitle = subtitleTitle.split(".");
            subtitleTitle = subtitleTitle[0]+".srt";

            var type = 'movies';

            playback_handler.startPlayback(res, platform, movieUrl, movieTitle, subtitleUrl, subtitleTitle, type);

        } else {
            console.log("File " + movieTitle + " could not be found!" .red);
        }
    });
};


exports.progress = function (req, res){
    // db.query("CREATE TABLE IF NOT EXISTS progressionmarker (title TEXT PRIMARY KEY, progression INTEGER, transcodingstatus TEXT)");

    // var incommingData   = req.body
    // , movieTitle        = incommingData.title
    // , progression       = incommingData.progression
    // , transcodingstatus = 'pending';

    // if(movieTitle !== undefined && progression !== undefined){
    //     var progressionData = [movieTitle, progression, transcodingstatus];
    //     db.query('INSERT OR REPLACE INTO progressionmarker VALUES(?,?,?)', progressionData);
    //     res.status(200).send();
    // } else {
        res.status(500).send();
    // }

}


/** Private functions **/

fetchMovieData = function(req, res, metaType, serveToFrontEnd, getNewFiles) {
    console.log('Fetching movie data...', serveToFrontEnd);
    metafetcher.loadData(req, res, serveToFrontEnd);
}

getMovies = function(req, res, metaType, serveToFrontEnd,getNewFiles){
    console.log('Loading movie data...', serveToFrontEnd);
    Movie.all(function(err, movies) {
        if(err){
            serveToFrontEnd = true;
            if(getNewFiles === true){
                fetchMovieData(req, res, metaType, serveToFrontEnd,getNewFiles);
            }
        } else if (movies !== null && movies !== undefined && serveToFrontEnd !== false && movies.length > 0){
            console.log('Sending data to client...');
            res.json(movies);
        } else {
            console.log('Getting data...');
            serveToFrontEnd = true;
            if(getNewFiles === true){
                fetchMovieData(req, res, metaType, serveToFrontEnd,getNewFiles);
            }
        }
    });
}
