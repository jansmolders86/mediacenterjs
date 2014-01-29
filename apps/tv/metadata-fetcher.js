/* Global Imports */
var fs = require('fs'),
	os = require('os'),
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
    tvShow = tvShowInfos.title;

	app_cache_handler.ensureCacheDirExists('tv', tvShow);
	loadMetadataFromDatabase(tvShow, function (result) {
		if (result) {
			// Movie is already in the database.
			callback(result);
			return;
		}

		// New Movie. Fetch Metadata...
		fetchMetadataFromTrakt(tvShow, function(err, result) {
			if (err) {
				console.error(err);
				callback([]);
			}

            if(result !== null){
                var title           = result.title;
                var banner          = result.images.banner;
                var genre           = result.genre;
                var certification   = result.certification;
			}
			
			downloadTvShowBanner(banner, tvShow, function(err) {
				var banner = 'tv/css/img/nodata.jpg';
				
				if (err) {
					console.error(err);
				} else {
                banner = app_cache_handler.getFrontendCachePath('tv', tvShow, banner);
				}
				
				var metadata = [originalTitle, title, banner, genre, certification ];
				storeMetadataInDatabase(metadata, function() {
                    console.log('data stored in database!');
					loadMetadataFromDatabase(tvShow, callback);
				});
			});
		});
	});
};

/* Private Methods */

loadMetadataFromDatabase = function(movieTitle, callback) {
	db.query('SELECT * FROM tvshows WHERE local_name =? ', [ movieTitle ], {
            localName 		: String,
            title 		    : String,
            banner  	    : String,
            genre  	        : String,
            certification  	: String
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

storeMetadataInDatabase = function(metadata, callback) {
	db.query('INSERT OR REPLACE INTO tvshows VALUES(?,?,?,?,?)', metadata);
	callback();
};

fetchMetadataFromTrakt = function(tvShow, callback) {
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
                    callback(err);
                } else {
                    callback(null);
                }
            });
		} catch (exception) {
			callback(exception);
		}
	} else {
		callback('No banner specified!');
	}
};
