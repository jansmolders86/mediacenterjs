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
var fs = require('fs'),
	os = require('os'),
    colors = require('colors'),
    file_utils = require('../file-utils'),
	path = require('path'),
    app_cache_handler = require('../../handlers/app-cache-handler'),
    configuration_handler = require('../../handlers/configuration-handler'),
    tv_title_cleaner = require('../title-cleaner');

var config = configuration_handler.initializeConfiguration();

/* Variables */
// Init Database
var dblite = require('dblite')
if(os.platform() === 'win32'){
	dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');
db.on('info', function (text) { console.log(text) });
db.on('error', function (err) { console.error('Database error: ' + err) });

/* Constants */
var SUPPORTED_FILETYPES = new RegExp("(avi|mkv|mpeg|mov|mp4|wmv)$","g");
var count = 0;
var remaining;

/* Public Methods */

/**
 * Fetches the Metadata for the specified TV show from Trakt.
 * @param episode        The Title of the episode
 * @param callback       The Callback
 */
console.log('Meta gathering started: tv shows');

file_utils.getLocalFiles(config.tvpath, SUPPORTED_FILETYPES, function(err, files) {
    count = files.length;
    if(files.length === 0){
        console.log('Could not index any movies, please check given movie collection path');
    }
    for(var i = 0, l = files.length; i < l; ++i){
        var epsiode = files[i].file;
        var epsiodeTitle = epsiode.substring(epsiode.lastIndexOf("/")).replace(/^\/|\/$/g, '');

        if(epsiodeTitle === '' && files[i].file !== undefined){
            epsiodeTitle = files[i].file;
        }

        var newEpsiode = epsiodeTitle.split("/").pop();

        getMetadataForTvShow(newEpsiode, function() {
            remaining = count--;

            if(remaining === 1){
                setTimeout(function() {
                    process.exit(0);
                },1000);
            }

        });
    }
});

/**
 * Fetches the show Metadata for the specified episode from trakt
 * @param episode            A tv episode
 * @param callback           The Callback
 */
getMetadataForTvShow = function(episode, callback) {

    var originalTitle           = episode
    , episodeInfo               = tv_title_cleaner.cleanupTitle(episode)
    , episodeReturnedTitle      = episodeInfo.title
    , episodeStripped           = episodeReturnedTitle.replace(/(avi|mkv|mpeg|mpg|mov|mp4|wmv)$/,"")
    , episodeTitle              = episodeStripped.trimRight();

    getDataForStoredShow(originalTitle, episodeTitle, callback);
};

/* Private Methods */


/**
 * Fetches the show Metadata already stored in db based on episode
 * @param originalTitle      Original episode filename
 * @param episodeTitle       Cleaned up name of episode
 */
getDataForStoredShow = function(originalTitle, episodeTitle, callback){

    // Get show title
    getEpisodeData(episodeTitle, function(episodedata) {
        var showTitle = episodedata.episodeTitle;
        // Load tv show from database
        loadShowMetadataFromDatabase(showTitle, function (result) {

            // If found, send show data
            if (result !== null) {
                callback(result);
            }

            // If NOT found, check if episode already exists in db
            loadEpisodeMetadataFromDatabase(originalTitle, function (result) {
                // If found, Get show data
                if (result) {
                    // Check if show is already in db
                    loadShowMetadataFromDatabase(showTitle, function (result) {
                        if (result !== null) {
                            callback(result);
                        }

                        getMetadataForShow(showTitle, function(showMetaData){
                            var TvshowTitle = showMetaData[0];

                            // Store show data in db and do lookup again
                            storeShowMetadataInDatabase(showMetaData, function() {

                                loadShowMetadataFromDatabase(TvshowTitle, function (result) {
                                    if (result !== null) {
                                        callback(result);
                                    } else {
                                        getDataForNewShow(originalTitle, TvshowTitle);
                                    }
                                });

                            });
                        });
                    });

                } else {
                    getDataForNewShow(originalTitle, episodeTitle);
                }
            });
        });
    });
}

/**
 * Fetches the (new) show Metadata not stored in db based on episode
 * @param originalTitle      Original episode filename
 * @param episodeTitle       Cleaned up name of episode
 */
getDataForNewShow = function(originalTitle, episodeTitle, callback){

    getEpisodeData( episodeTitle, function(episodedata) {

        if(episodedata !== null){
            var season = episodedata.episodeSeason
                , number = episodedata.episodeNumber
                , title = episodedata.episodeTitle
                , trimmedTitle = title.trim()
                , episodeMetadata = [originalTitle, trimmedTitle, season, number ];

            // Store episode data in db and do lookup again
            storeEpisodeMetadataInDatabase(episodeMetadata, function() {
                var newEpisodeTitle = episodeMetadata[0];
                loadShowMetadataFromDatabase(newEpisodeTitle, function (result) {
                    if (result !== null) {
                        callback(result);
                    }

                    getMetadataForShow(title, function(newshowMetaData){
                        var newTvshowTitle = newshowMetaData[0];
                        // Store show data in db and do lookup again
                        storeShowMetadataInDatabase(newshowMetaData, function() {

                            loadShowMetadataFromDatabase(newTvshowTitle, function (result) {
                                if (result !== null) {
                                    callback(result);
                                } else{
                                    console.log('Cannot resolve tv show' .red);
                                    callback(null);
                                }
                            });

                        });
                    });
                });
            });
        } else {
            console.log('Cannot resolve tvShow' .red);
            callback(null);
        }

    })
}

getMetadataForShow = function(tvTitle, callback){
    var genre = "No data";
    var certification = "No data";
    var showTitle = 'unknown show';

    getMetadataFromTrakt(tvTitle, function(err, result){
        if (err) {
            console.error('Error returning Trakt data', err);
        } else {
            var traktResult = result;
            var banner	= traktResult.images.banner;

            showTitle = traktResult.title;
            app_cache_handler.ensureCacheDirExists('tv', showTitle);

            downloadTvShowBanner(banner, showTitle, function(err) {
                if (err) {
                    var bannerImage= "/tv/css/img/nodata.jpg";
                }

                if(traktResult !== null){
                    if(traktResult.genres !== undefined){
                        genre = traktResult.genres;
                    }
                    if (traktResult.certification !== undefined) {
                        certification = traktResult.certification;
                    }
                    if(traktResult.title !== undefined){
                        var showTitleResult = traktResult.title;

                        var bannerImage = '/data/tv/'+showTitleResult+'/'+path.basename(banner);
                    }
                }

                var showTitle = showTitleResult.toLowerCase();
                var showMetaData = [showTitle, bannerImage, genre, certification];
                callback(showMetaData);

            });

        }

    });
}


loadEpisodeMetadataFromDatabase = function(tvTitle, callback) {
	db.query('SELECT * FROM tvepisodes WHERE localName =? ', [ tvTitle ], {
            localName 			: String,
            title 		    	: String,
            season  	        : Number,
            episode  	       	: Number
		},
		function(rows) {
			if (typeof rows !== 'undefined' && rows.length > 0){
				console.log('found info for tvepisode' .green);
				callback(rows);
			} else {
				console.log('new tvepisode' .green);
				callback(null);
			}
		}
	);
};

loadShowMetadataFromDatabase = function(tvShowtitle, callback) {
    console.log('Looking for tvShow', tvShowtitle);
    db.query('SELECT * FROM tvshows WHERE title =? ', [ tvShowtitle ], {
            title 			    : String,
            banner 		    	: String,
            genre  	            : String,
            certification  	    : String
        },
        function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){
                console.log('Found info for tvShow', tvShowtitle);
                callback(rows);
            } else {
                console.log('New tvshow',tvShowtitle);
                callback(null);
            }
        }
    );
};


storeShowMetadataInDatabase = function(metadata, callback) {
    db.query("CREATE TABLE IF NOT EXISTS tvshows (title VARCHAR PRIMARY KEY,banner VARCHAR, genre VARCHAR, certification VARCHAR)");
	db.query('INSERT OR REPLACE INTO tvshows VALUES(?,?,?,?)', metadata);
	callback();
};

storeEpisodeMetadataInDatabase = function(metadata, callback) {
    db.query("CREATE TABLE IF NOT EXISTS tvepisodes (localName TEXT PRIMARY KEY,title VARCHAR, season INTEGER, epsiode INTEGER)");
    db.query('INSERT OR REPLACE INTO tvepisodes VALUES(?,?,?,?)', metadata);
    callback();
};

getMetadataFromTrakt = function(tvShow, callback) {
    var options = { query: tvShow }
    , Trakt = require('trakt')
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

getEpisodeData = function(episodeFilename, callback){
    console.log('Looking for season data for episode ', episodeFilename);
    if(episodeFilename !== null || episodeFilename !== undefined || episodeFilename !== ''){
        var episodeTitle 		= episodeFilename.replace(/[sS]([0-9]{2})[eE]([0-9]{2})/, '')
            , episodeSeasonMatch 	= episodeFilename.match(/[sS]([0-9]{2})/)
            , episodeNumberMatch 	= episodeFilename.match(/[eE]([0-9]{2})/)

            if(episodeSeasonMatch !== undefined || episodeSeasonMatch !== null || episodeSeasonMatch !== false){
                var episodeSeason = episodeSeasonMatch[0].replace(/[sS]/,"")
            } else {
                var episodeSeason = '';
            }
            if(episodeNumberMatch !== undefined || episodeNumberMatch !== null || episodeNumberMatch !== false){
                 var episodeNumber 		= episodeNumberMatch[0].replace(/[eE]/,"")
            } else {
                var episodeNumber = '';
            }

            var episodeData = {
                "episodeTitle"      : episodeTitle.toLowerCase(),
                "episodeSeason"     : episodeSeason,
                "episodeNumber"    	: episodeNumber
            }
        callback(episodeData);
    } else {
        callback(null);
    }
}
