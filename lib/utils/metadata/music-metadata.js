/* Global Imports */
var dblite = require('dblite'),
    fs = require('fs'),
    path = require('path'),
    os = require('os'),
    file_utils = require('../file-utils'),
    ajax_utils = require('../ajax-utils'),
    app_cache_handler = require('../../handlers/app-cache-handler'),
    configuration_handler = require('../../handlers/configuration-handler'),
    LastfmAPI = require('lastfmapi'),
    musicmetadata = require('musicmetadata'),
    album_title_cleaner = require('../title-cleaner');

var config = configuration_handler.initializeConfiguration();

/* Constants */

var SUPPORTED_FILETYPES = new RegExp("\.(mp3)","g")
    , count = 0
    , remaining;

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
 * Fetches the Metadata for the specified Album from discogs.org.
 * @param albumTitle         The Title of the Album
 * @param callback           The Callback
 */

console.log('Meta gathering started: music');

file_utils.getLocalFiles(config.musicpath, SUPPORTED_FILETYPES, function(err, files) {
    count = files.length;
    for(var i = 0, l = files.length; i < l; ++i){
        var trackTitle = files[i].file;
        var filename = files[i].href;
        var parser = new musicmetadata(fs.createReadStream(filename));
        parser.on('metadata', function (result) {

            if(result !== undefined && result !== null){
                var  album         = result.album
                    , artist       = result.artist[0]
                    , title        = result.title
                    , track        = result.track
                    , year         = result.year;
            }

            getAdditionalDataFromLastFM(album, artist, function(cover){
                var metadata = [album,artist,title,year,track,cover,trackTitle];
                storeMetadataInDatabase(metadata, function() {
                    remaining = count--;

                    if(remaining === 1){
                        setTimeout(function() {
                            process.exit(0);
                        },1000);
                    }

                    loadMetadataFromDatabase(album, callback);

                });
            })
        });
    }
});



storeMetadataInDatabase = function(metadata, callback) {
    console.log('Writing data to table for', metadata[0] .green);
    db.query("CREATE TABLE IF NOT EXISTS music (album TEXT PRIMARY KEY,artist VARCHAR, title VARCHAR, year VARCHAR, track VARCHAR, cover VARCHAR, trackTitle VARCHAR)");
    db.query('INSERT OR REPLACE INTO music VALUES(?,?,?,?,?,?,?)', metadata);
    callback();
};

getAdditionalDataFromLastFM = function(album, artist, callback) {
    // Currently only the cover is fetched. Could be expanded in the future

    var apiUrl = "http://www.mediacenterjs.com/global/js/musickey.js";
    ajax_utils.xhrCall(apiUrl, function(response) {
        var api = JSON.parse(response);

        var lastfm = new LastfmAPI({
            'api_key' : api.api_key,
            'secret' : api.api_secret
        });

        lastfm.album.getInfo({
            'artist' : artist,
            'album' : album
        }, function(err, album){
            if(err){
                console.log('err ',err);
            }
           // var cover = album.image[0].#text;

            if(album !== undefined && album.image[0] !== undefined && album.image[0] !== null){
                var cover = album.image[2]["#text"];

                if(cover !== ''){
                  //  downloadCover(cover, album, function(){
                        callback(cover);
                  //  });
                } else {
                    cover = '';
                    callback(cover);
                }
            }

        });


    });
}

downloadCover = function(cover, album, callback){

    if(cover) {
        try {
            app_cache_handler.downloadDataToCache('music', album, cover, function(err) {
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
        callback('No cover specified!');
    }

}

/* Private Methods */

loadMetadataFromDatabase = function(album, callback) {
    console.log('Getting data from database...');
    db.query('SELECT * FROM music WHERE album = ? ', [ album ], {
            album	    : String,
            artist		: String,
            title		: String,
            year		: String,
            track		: String,
            cover		: String,
            trackTitle  : String
        },
        function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){
                console.log('found info for album' .green);
                callback(rows);
            } else {
                console.log('new album' .green);
                callback(null);
            }
        }
    );
};

