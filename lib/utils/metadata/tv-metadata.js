
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
var dblite = require('dblite'),
    fs = require('graceful-fs'),
    path = require('path'),
    os = require('os'),
    file_utils = require('../file-utils'),
    ajax_utils = require('../ajax-utils'),
    app_cache_handler = require('../../handlers/app-cache-handler'),
    configuration_handler = require('../../handlers/configuration-handler'),
    Trakt = require('trakt'),
    tv_title_cleaner = require('../title-cleaner');

var config = configuration_handler.initializeConfiguration();

/* Constants */

var SUPPORTED_FILETYPES = new RegExp("(avi|mkv|mpeg|mov|mp4|wmv)$","g");  //Pipe seperated
var start = new Date();
var nrScanned = 0;
var totalFiles = 0;

// Init Database
var database = require('../database-connection');
var db = database.db;

db.query("CREATE TABLE IF NOT EXISTS tvshows (title VARCHAR PRIMARY KEY,banner VARCHAR, genre VARCHAR, certification VARCHAR)");
db.query("CREATE TABLE IF NOT EXISTS tvepisodes (localName TEXT PRIMARY KEY,title VARCHAR, season INTEGER, epsiode INTEGER)");

/* Public Methods */

/**
 * Fetches the Metadata for the specified Album from discogs.org.
 * @param albumTitle         The Title of the Album
 * @param callback           The Callback
 */

/* walk over a directory recursivly */
var dir = path.resolve(config.tvpath);
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

var setupParse = function(results) {
    if (!results) {
        console.log('no results!');
    }
    if (results && results.length > 0) {
        var file = results.pop();
        doParse(file, function() {
            setupParse(results);
        });
    }
};


var doParse = function(file, callback) {
    var originalTitle           = file.split('/').pop()
    , episodeInfo               = tv_title_cleaner.cleanupTitle(originalTitle)
    , episodeReturnedTitle      = episodeInfo.title
    , episodeStripped           = episodeReturnedTitle.replace(/.(avi|mkv|mpeg|mpg|mov|mp4|wmv)$/,"")
    , episodeTitle              = episodeStripped.trimRight();

    loadEpisodeMetadataFromDatabase(episodeTitle, function(episodedata) {

        if(episodedata !== null){
            var showTitle = episodedata.episodeTitle;
            loadShowMetadataFromDatabase(showTitle);
        } else {
            getDataForNewShow(originalTitle, episodeTitle);
        }

        nrScanned++;

        var perc = parseInt((nrScanned / totalFiles) * 100);
        var increment = new Date(), difference = increment - start;
        if (perc > 0) {
            var total = (difference / perc) * 100, eta = total - difference;
            //console.log('Item '+nrScanned+' from '+totalFiles+', '+perc+'% done \r');
            console.log(perc);
        }

    });
};


/**
 * Fetches the (new) show Metadata not stored in db based on episode
 * @param originalTitle      Original episode filename
 * @param episodeTitle       Cleaned up name of episode
 */
getDataForNewShow = function(originalTitle, episodeTitle){

    var episodeSeason       = ''
        , season            = ''
        , number            = ''
        , title             = ''
        , trimmedTitle      = ''
        , episodeNumber     = '';

    var showTitle            = episodeTitle.replace(/[sS]([0-9]{2})[eE]([0-9]{2})/, '')
    , episodeSeasonMatch     = episodeTitle.match(/[sS]([0-9]{2})/)
    , episodeNumberMatch     = episodeTitle.match(/[eE]([0-9]{2})/)

    if( episodeSeasonMatch){
        episodeSeason = episodeSeasonMatch[0].replace(/[sS]/,"")
    }
    if(episodeNumberMatch ){
        episodeNumber = episodeNumberMatch[0].replace(/[eE]/,"")
    }

    var episodeData = {
        "showTitle"         : showTitle.toLowerCase(),
        "episodeSeason"     : episodeSeason,
        "episodeNumber"        : episodeNumber
    }

    season          = episodeData.episodeSeason;
    number          = episodeData.episodeNumber;
    title           = episodeData.showTitle;
    trimmedTitle    = title.trim();

    var episodeMetadata = [originalTitle, trimmedTitle, season, number ];

    // Store episode data in db and do lookup again
    storeEpisodeMetadataInDatabase(episodeMetadata, function() {
        var newEpisodeTitle = episodeMetadata[0];

        getMetadataForShow(trimmedTitle, function(newshowMetaData){
            var newTvshowTitle = newshowMetaData[0];
            // Store show data in db and do lookup again
            storeShowMetadataInDatabase(newshowMetaData, function() {
                loadShowMetadataFromDatabase(showTitle);
            });
        });

    });
}

getMetadataForShow = function(tvTitle, callback){
    var genre           = "No data"
        , certification   = "No data"
        , showTitle       = 'unknown show'
        , bannerImage     = '/tv/css/img/nodata.jpg'

    getMetadataFromTrakt(tvTitle, function(err, result){
        if (err) {
            console.error('Error returning Trakt data', err);
        } else {
            var traktResult = result;
            bannerImage    = traktResult.images.banner;
            showTitle = traktResult.title;

            if(traktResult !== null){
                if(traktResult.genres !== undefined){
                    genre = traktResult.genres;
                }
                if (traktResult.certification !== undefined) {
                    certification = traktResult.certification;
                }
                if(traktResult.title !== undefined){
                    var showTitleResult = traktResult.title;
                }
            }

            showTitle = showTitleResult.toLowerCase();
            var showMetaData = [showTitle, bannerImage, genre, certification];
            callback(showMetaData);

        }
    });
}



loadEpisodeMetadataFromDatabase = function(tvTitle, callback) {
    db.query('SELECT * FROM tvepisodes WHERE localName =? ', [ tvTitle ], {
        localName             : String,
        title                 : String,
        season              : Number,
        episode                 : Number
    },
    function(rows) {
        if (typeof rows !== 'undefined' && rows.length > 0){
            callback(rows);
        } else {
            callback(null);
        }
    });
};

loadShowMetadataFromDatabase = function(tvShowtitle) {
    db.query('SELECT * FROM tvshows WHERE title =? ', [ tvShowtitle ], {
        title                 : String,
        banner                 : String,
        genre                  : String,
        certification          : String
    },
    function(rows) {
        if (typeof rows === 'undefined' && rows.length < 1){
            getDataForNewShow(originalTitle, episodeTitle);
        }
    });

    if(nrScanned === totalFiles){
        var stop = new Date();
        //console.log("Scan complete! Time taken:", UMS((stop - start) / 100, true));
        db.close();
        process.exit();
    }
};


storeShowMetadataInDatabase = function(metadata, callback) {
    db.query('INSERT OR REPLACE INTO tvshows VALUES(?,?,?,?)', metadata);
    callback();
};

storeEpisodeMetadataInDatabase = function(metadata, callback) {
    db.query('INSERT OR REPLACE INTO tvepisodes VALUES(?,?,?,?)', metadata);
    callback();
};

getMetadataFromTrakt = function(tvShow, callback) {
    var options = { query: tvShow }
    , trakt = new Trakt({username: 'mediacenterjs', password: 'mediacenterjs'});

    trakt.request('search', 'shows', options, function(err, result) {
        if (err) {
            console.log('error retrieving tvshow info', err .red);
            callback(err, null);
        } else {
            var tvSearchResult = result[0];

            if (tvSearchResult !== undefined && tvSearchResult !== '' && tvSearchResult !== null) {
                callback(err, tvSearchResult);
            }
        }
    });
};

downloadTvShowBanner = function(banner, tvShow, callback) {
    if(banner) {
        try {
            app_cache_handler.downloadDataToCache('tv', tvShow, banner, function(err) {
                if (err) {
                    callback('Error downloading to cache ');
                    callback(err);
                } else {
                    callback(null);
                }
            });
        } catch (exception) {
            console.log('Error downloading to cache ');
            callback(exception);
        }
    } else {
        callback('No banner specified!');
    }
};


walk(dir,  function(err, results) {
    totalFiles = (results) ? results.length : 0;
    //console.log("Starting scan for", totalFiles, "files");
    setupParse(results);
});

var UMS = function(seconds, ignoreZero) {
    var hours = parseInt(seconds / 3600), rest = parseInt(seconds % 3660), minutes = parseInt(rest / 60), seconds = parseInt(rest % 60);
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    if (ignoreZero) {
        if (hours == "00") {
            hours = "";
        } else {
            hours = hours + ":";
        }
    } else {
        hours = hours + ":";
    }
    return hours + minutes + ":" + seconds;
};
