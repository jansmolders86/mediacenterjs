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
 * Fetches the Metadata for the specified Movie from themoviedb.org.
 * @param tvShow         The Title of the tvShow
 * @param callback           The Callback
 */
exports.fetchMetadataForTvShow = function(tvShow, callback) {
	var originalTitle = tvShow;
	var tvShowInfos = tv_title_cleaner.cleanupTitle(tvShow);
    var tvTitle = tvShowInfos.title;

    console.log('Starting lookup...');
    getEpisodeData( tvTitle, function(episodedata) {
        var showTitle = episodedata.tvShowTitle;

        console.log('Epsiode for lookup',showTitle);
        loadShowMetadataFromDatabase(showTitle, function (result) {
            if (result) {
                console.log('tvShow '+ showTitle +' found in database', result);
                callback(result);
                return;
            }
            console.log('New show!',showTitle);
            loadEpisodeMetadataFromDatabase(tvShow, function (result) {
                if (result) {
                    getMetadataForShow(tvShow, function(showMetaData){
                        storeShowMetadataInDatabase(showMetaData, function() {
                            console.log('Show data stored in database!');
                            var tvShowtitle = showMetaData.title;
                            loadShowMetadataFromDatabase(tvShowtitle, callback);
                        });
                    });
                } else {
                    console.log('New episode, getting data!');
                    getEpisodeData( tvShow, function(episodedata) {
                        var season = episodedata.tvShowSeason;
                        var episode = episodedata.tvShowEpisode;
                        var showTitle = episodedata.tvShowTitle;
                        var showMetadata = [originalTitle, showTitle, season, episode ];

                        storeEpisodeMetadataInDatabase(showMetadata, function() {
                            console.log('Epsiode data stored in database...');
                            var tvShowtitle = showMetadata.showTitle;

                            loadShowMetadataFromDatabase(tvShowtitle, callback);
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
                } else {
                    var bannerImage = '/data/tv/'+tvTitle+'/'+path.basename(banner);
                }

                if(traktResult !== null){
                    if(traktResult.genres !== undefined){
                        genre = traktResult.genres;
                    }
                    if (traktResult.certification !== undefined) {
                        certification = traktResult.certification;
                    }
                    if(traktResult.title !== undefined){
                        showTitle = traktResult.title;
                    }
                }

                showTitle.toLowerCase();

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
				console.log(rows)
				callback(rows);
			} else {
				console.log('new tvepisode' .green);
				callback(null);
			}
		}
	);
};

loadShowMetadataFromDatabase = function(tvShowtitle, callback) {
    db.query('SELECT * FROM tvshows WHERE title =? ', [ tvShowtitle ], {
            title 			    : String,
            banner 		    	: String,
            genre  	            : String,
            certification  	    : String
        },
        function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){
                console.log('found info for tvShow' .green);
                console.log(rows)
                callback(rows);
            } else {
                console.log('new tvshow' .green);
                callback(null);
            }
        }
    );
};


storeShowMetadataInDatabase = function(metadata, callback) {
    db.query("CREATE TABLE IF NOT EXISTS tvshows (title TEXT PRIMARY KEY,banner VARCHAR, genre VARCHAR, certification VARCHAR)");
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

getEpisodeData = function(tvTitle, callback){
    var tvshowdata = tvTitle.replace(/[sS]([0-9]{2})[eE]([0-9]{2})/, '')
    , tvShowSeasonMatch = tvTitle.match(/[sS]([0-9]{2})/)
    , tvShowEpisodeMatch = tvTitle.match(/[eE]([0-9]{2})/)
    , season = tvShowSeasonMatch[0].replace(/[sS]/,"")
    , episode = tvShowEpisodeMatch[0].replace(/[eE]/,"")
    , episodeData = {
        "tvShowTitle"      : tvshowdata,
        "tvShowSeason"     : season,
        "tvShowEpisode"    : episode
    }
    callback(episodeData);
}
