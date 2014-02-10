/* Global Imports */
var fs = require('fs'),
	os = require('os'),
	path = require('path'),
    app_cache_handler = require('../../lib/handlers/app-cache-handler'),
	config = require('../../lib/handlers/configuration-handler').getConfiguration(),
	tv_title_cleaner = require('../../lib/utils/title-cleaner');

/* Variables */
// Init Database
var dblite = require('dblite')
if(os.platform() === 'win32'){
	dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');
db.on('info', function (text) { console.log(text) });
db.on('error', function (err) { console.error('Database error: ' + err) });

/* Public Methods */

/**
 * Fetches the Metadata for the specified TV show from Trakt.
 * @param episode        The Title of the episode
 * @param callback       The Callback
 */
exports.fetchMetadataForTvShow = function(episode, callback) {
    // Clean incoming episode title
	var originalTitle = episode;
	var episodeInfo = tv_title_cleaner.cleanupTitle(episode);
    var episodeTitle = episodeInfo.title;

    // Get show title
    getEpisodeData(episodeTitle, function(episodedata) {
        var showTitle = episodedata.episodeTitle;

        // Load tv show from database
        loadShowMetadataFromDatabase(showTitle, function (result) {

            // If found, send show data
            if (result !== null) {
                callback(result);
                return;
            }

            // If NOT found, check if episode already exists in db
            loadEpisodeMetadataFromDatabase(originalTitle, function (result) {
                // If found, Get show data
                if (result) {
					// Check if show is already in db
					loadShowMetadataFromDatabase(showTitle, function (result) {
						if (result !== null) {
							callback(result);
							return;
						}
						
						getMetadataForShow(showTitle, function(showMetaData){
							var TvshowTitle = showMetaData[0];

							// Store show data in db and do lookup again
							storeShowMetadataInDatabase(showMetaData, function() {
								
								loadShowMetadataFromDatabase(TvshowTitle, function (result) {
									if (result !== null) {
										callback(result);
										return;
									}
								});

							});
						});
					});

                } else {

                    // If NOT found, Get episode data
                    getEpisodeData( episodeTitle, function(episodedata) {
                        var season = episodedata.episodeSeason
                        , number = episodedata.episodeNumber
                        , title = episodedata.episodeTitle
                        , episodeMetadata = [originalTitle, title, season, number ];

                        // Store episode data in db and do lookup again
                        storeEpisodeMetadataInDatabase(episodeMetadata, function() {
							var newEpisodeTitle = episodeMetadata[0]
							loadShowMetadataFromDatabase(newEpisodeTitle, function (result) {
								if (result !== null) {
									callback(result);
									return;
								}
								getMetadataForShow(newEpisodeTitle, function(newshowMetaData){
									var newTvshowTitle = newshowMetaData[0]
									// Store show data in db and do lookup again
									storeShowMetadataInDatabase(newshowMetaData, function() {

										loadShowMetadataFromDatabase(newTvshowTitle, function (result) {
											if (result !== null) {
												callback(result);
												return;
											} else{
												console.log('Cannot resolve tvShow' .red);
											}
										});

									});
								});
							});
                        });
                    });
                }
            });
        });
    });
};

/* Private Methods */


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
            season  	        : String,
            epsiode  	       	: String
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
    db.query("CREATE TABLE IF NOT EXISTS tvepisodes (localName TEXT PRIMARY KEY,title VARCHAR, season VARCHAR, epsiode VARCHAR)");
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
    var episodeTitle 		= episodeFilename.replace(/[sS]([0-9]{2})[eE]([0-9]{2})/, '')
    , episodeSeasonMatch 	= episodeFilename.match(/[sS]([0-9]{2})/)
    , episodeNumberMatch 	= episodeFilename.match(/[eE]([0-9]{2})/)
    , episodeSeason 		= episodeSeasonMatch[0].replace(/[sS]/,"")
    , episodeNumber 		= episodeNumberMatch[0].replace(/[eE]/,"")
    , episodeData = {
        "episodeTitle"      : episodeTitle.toLowerCase(),
        "episodeSeason"     : episodeSeason,
        "episodeNumber"    	: episodeNumber
    }
    callback(episodeData);
}
