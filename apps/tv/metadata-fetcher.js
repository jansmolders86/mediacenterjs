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

	loadMetadataFromDatabase(tvShow, function (result) {
		if (result) {
			callback(result);
			return;
		}

		fetchMetadataFromTrakt(tvTitle, function(err, result) {
			var banneImage = "/tv/css/img/nodata.jpg";
			var title = tvTitle;
			var genre = "No data";
			var certification = "No data";
			
			if (err) {
				console.error(err);
				callback([]);
			} else {
				var traktResult = result;
				app_cache_handler.ensureCacheDirExists('tv', tvTitle);
				var banner	= traktResult.images.banner;
				var banneImage = path.basename(banner);
			}

			downloadTvShowBanner(banner, tvTitle, function(err) {

				if (err) {
					console.error(err);
				} 
				
            if(traktResult !== null){  
                if(traktResult.genre !== undefined){
             		genre = traktResult.genre;
                }
            	 if (traktResult.certification !== undefined) {
                	certification = traktResult.certification;
                }
				}
				
				var metadata = [originalTitle, tvTitle, banneImage, genre, certification ];
				console.log('metadata',metadata);
				storeMetadataInDatabase(metadata, function() {
               console.log('data stored in database!');
					loadMetadataFromDatabase(tvTitle, callback);
				});
			});
		});
	});
};

/* Private Methods */

loadMetadataFromDatabase = function(tvTitle, callback) {
	db.query('SELECT * FROM tvshows WHERE localName =? ', [ tvTitle ], {
            localName 			: String,
            title 		    	: String,
            banner  	    		: String,
            genre  	        	: String,
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
