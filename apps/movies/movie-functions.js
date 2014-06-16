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
    , metafetcher = require('../../lib/utils/metadata-fetcher')
	, config = require('../../lib/handlers/configuration-handler').getConfiguration();

    var database = require('../../lib/utils/database-connection');
    var db = database.db;


exports.loadItems = function (req, res, serveToFrontEnd){
    var metaType = "movie";
    var getNewFiles = true;
    db.query("CREATE TABLE IF NOT EXISTS movies (original_name TEXT PRIMARY KEY, title TEXT, poster_path VARCHAR, backdrop_path VARCHAR, imdb_id INTEGER, rating VARCHAR, certification VARCHAR, genre VARCHAR, runtime VARCHAR, overview TEXT, cd_number TEXT, adult TEXT)");

    
    if(serveToFrontEnd === false){
        fetchMovieData(req, res, metaType, serveToFrontEnd);
    } else if(serveToFrontEnd === undefined || serveToFrontEnd === null){
        var serveToFrontEnd = true; 
        getMovies(req, res, metaType, serveToFrontEnd,getNewFiles);
    } else{
        serveToFrontEnd = true; 
        getMovies(req, res, metaType, serveToFrontEnd,getNewFiles);
    }
};


exports.backdrops = function (req, res){
    db.query('SELECT * FROM movies',{
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
    }, function(rows) {
        if (rows !== null && rows !== undefined){
            var backdropArray = [];
            rows.forEach(function(item){
               var backdrop = item.backdrop_path;
               backdropArray.push(backdrop)
            });
            res.json(backdropArray);
        } 
    });
};



exports.playMovie = function (req, res, platform, movieTitle){
	file_utils.getLocalFile(config.moviepath, movieTitle, function(err, file) {
		if (err) console.log(err .red);
		if (file) {
			var movieUrl = file.href
			, movie_playback_handler = require('./movie-playback-handler');

            var subtitleUrl = movieUrl;
            subtitleUrl = subtitleUrl.split(".");
            subtitleUrl = subtitleUrl[0]+".srt";

            var subtitleTitle = movieTitle;
            subtitleTitle = subtitleTitle.split(".");
            subtitleTitle = subtitleTitle[0]+".srt";

            movie_playback_handler.startPlayback(res, platform, movieUrl, movieTitle, subtitleUrl, subtitleTitle);
    
		} else {
			console.log("File " + movieTitle + " could not be found!" .red);
		}
	});
};

exports.getGenres = function (req, res){
	db.query('SELECT genre FROM movies', function(rows) {
		if (typeof rows !== 'undefined' && rows.length > 0){
			var allGenres = rows[0][0].replace(/\r\n|\r|\n| /g,","),
				genreArray = allGenres.split(',');
			res.json(genreArray);
		}
	});
};


exports.sendState = function (req, res){ 
    db.query("CREATE TABLE IF NOT EXISTS progressionmarker (movietitle TEXT PRIMARY KEY, progression TEXT, transcodingstatus TEXT)");

    var incommingData   = req.body
    , movieTitle        = incommingData.movieTitle
    , progression       = incommingData.currentTime
    , transcodingstatus = 'pending';
    
    if(movieTitle !== undefined && progression !== undefined){
        var progressionData = [movieTitle, progression, transcodingstatus];
        db.query('INSERT OR REPLACE INTO progressionmarker VALUES(?,?,?)', progressionData);
    }
   
}


/** Private functions **/

fetchMovieData = function(req, res, metaType, serveToFrontEnd, getNewFiles) {
    console.log('Fetching movie data...');
    metafetcher.fetch(req, res, metaType, function(type){
        if(type === metaType){
            getNewFiles = false;
            getMovies(req, res, metaType, serveToFrontEnd);
        }
    });             
}

getMovies = function(req, res, metaType, serveToFrontEnd,getNewFiles){
    console.log('Loading movie data...', serveToFrontEnd);
    db.query('SELECT * FROM movies',{
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
    function(err, rows) {
        if(err){
            db.query("CREATE TABLE IF NOT EXISTS movies (original_name TEXT PRIMARY KEY, title TEXT, poster_path VARCHAR, backdrop_path VARCHAR, imdb_id INTEGER, rating VARCHAR, certification VARCHAR, genre VARCHAR, runtime VARCHAR, overview TEXT, cd_number TEXT, adult TEXT)");
            console.log("DB error",err);
            serveToFrontEnd = true;
            if(getNewFiles === true){
                fetchMovieData(req, res, metaType, serveToFrontEnd,getNewFiles);
            }
        } else if (rows !== null && rows !== undefined && serveToFrontEnd !== false && rows.length > 0){
            console.log('Sending data to client...');
            res.json(rows);
        } else {
            console.log('Getting data...');
            serveToFrontEnd = true;
            
            if(getNewFiles === true){
                fetchMovieData(req, res, metaType, serveToFrontEnd,getNewFiles);
            }
        }
    });
}