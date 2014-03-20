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

db.query("CREATE TABLE IF NOT EXISTS tracks (title TEXT PRIMARY KEY, track TEXT, album TEXT, artist TEXT, year TEXT)");
db.query("CREATE TABLE IF NOT EXISTS albums (album TEXT PRIMARY KEY,artist TEXT, year TEXT, cover VARCHAR)");

file_utils.getLocalFiles(config.musicpath, SUPPORTED_FILETYPES, function(err, files) {
    count = files.length;

    var trackMetadata = [];

    for(var i = 0, l = files.length; i < l; ++i){

        var filename = files[i].href;

        var parser = new musicmetadata(fs.createReadStream(filename));
        parser.on('metadata', function (result) {

            remaining = count--;

            var title       = ''
                , track     = ''
                , album     = ''
                , artist    = ''
                , year      = '';

            if(result !== undefined && result !== null){

                if(result.title !== undefined){
                    title = result.title;
                }
                if(result.track.no !== undefined){
                    track = result.track.no;
                }
                if(result.album !== undefined){
                    album = result.album;
                }
                if(result.artist[0] !== undefined){
                    artist = result.artist[0];
                }
                if(result.year !== undefined){
                    year = result.year;
                }
            }

            var trackData  ={
                "title"     : title,
                "track"     : track,
                "album"     : album,
                "artist"    : artist,
                "year"      : year
            };

            trackMetadata.push(trackData);

            if(remaining === 1){

                var trackCount = trackMetadata.length;
                var remainingTracks;

                trackMetadata.forEach(function(item, value){

                    var title   = item.title,
                     track   = item.track,
                     album   = item.album,
                     artist  = item.artist,
                     year    = item.year;


                    getMusicMetadata(title, track, album, artist, year, function(result){

                        remainingTracks = trackCount--;

                        if(remainingTracks === 1){
                            console.log('doen', result);
                            setTimeout(function() {
                                process.exit(0);
                            },1000);
                        }

                    });
                });

            }

        });

        parser.on('done', function (err) {
            if (err) throw err;
            console.log('Done')
        });

    }
});

getMusicMetadata = function(title,track, album, artist, year, callback){
    // Load track data from db
    getTrackFromDB(title,function(result){
        if(result !== null){
            //Track already in DB, check for album
            getAlbumFromDB(album,function(result){

                if(result !== null){
                    callback(result);
                }

                return;
            });
        }


        // If new track, store in database
        var metadata =  [title,track, album, artist, year];
        storeTrackInDB(metadata, function(result){

            // Get cover from LastFM
            getAdditionalDataFromLastFM(album, artist, function(cover){
                var metadata = [album,artist,year,cover];

                //Store Album in DB
                storeAlbumInDatabase(metadata, function() {

                    //Load Album in DB
                    getAlbumFromDB(album,function(result){

                        //Send Album
                        callback(result);

                    });

                });
            })
        });
    });

}

getTrackFromDB = function(title, callback){
    db.query('SELECT * FROM tracks WHERE title =? ', [ title ], {
            track         	: String,
            album 		    : String,
            artist  	    : String,
            year            : String
        },
        function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){
                console.log('found info for track' .green);
                callback(rows);
            } else {
                console.log('new track' .green);
                callback(null);
            }
        }
    );
}

storeTrackInDB = function(metadata, callback){
    db.query('INSERT OR REPLACE INTO tracks VALUES(?,?,?,?,?)', metadata);
    callback();
}

storeAlbumInDatabase = function(metadata, callback){
    db.query('INSERT OR REPLACE INTO albums VALUES(?,?,?,?)', metadata);
    callback();
}


getAlbumFromDB = function (album, callback){
    db.query('SELECT * FROM albums WHERE album =? ', [ album ], {
            album 		    : String,
            artist  	    : String,
            year            : String,
            cover           : String
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
}


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

/*
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
*/

