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
    LastfmAPI = require('lastfmapi'),
    mm = require('musicmetadata'),
    album_title_cleaner = require('../title-cleaner');

var config = configuration_handler.initializeConfiguration();

/* Constants */

var SUPPORTED_FILETYPES = "mp3";
var start = new Date();
var nrScanned = 0;
var totalFiles = 0;

// Init Database
var database = require('../database-connection');
var db = database.db;

db.query("CREATE TABLE IF NOT EXISTS albums (album TEXT PRIMARY KEY, artist TEXT, year INTEGER, genre TEXT, cover VARCHAR)");
db.query("CREATE TABLE IF NOT EXISTS tracks (title TEXT PRIMARY KEY, track INTEGER, album TEXT, artist TEXT, year INTEGER, genre TEXT, filename TEXT, filepath TEXT)");

/* Public Methods */

/**
 * Fetches the Metadata for the specified Album from discogs.org.
 * @param albumTitle         The Title of the Album
 * @param callback           The Callback
 */

/* walk over a directory recursivly */
var dir = path.resolve(config.musicpath);
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
                    if (ext === SUPPORTED_FILETYPES) {
                        results.push(file);
                        // doParse(file);
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
    var parser = new mm(fs.createReadStream(file));

    parser.on('metadata', function(result) {
        if(result){
            var title       = (result.title)        ? result.title.replace(/\\/g, '') : ''
                , track     = (result.track.no)     ? result.track.no : ''
                , album     = (result.album)        ? result.album.replace(/\\/g, '') : ''
                , genre     = 'Unknown'
                , artist    = (result.artist[0])    ? result.artist[0].replace(/\\/g, '') : ''
                , year      = (result.year)         ? result.year : 0;


            if(result.genre !== undefined ){
                var genrelist = result.genre;
                if(genrelist.length > 0 && genrelist !== ""){
                    genre = genrelist[0];
                }
            }

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
                var filename = path.basename(file);
                // If new track, store in database
                var trackMetadata =  [title,track, album, artist, year, genre, filename, file];
                storeTrackInDB(trackMetadata, function(result){

                    // Get cover from LastFM
                    getAdditionalDataFromLastFM(album, artist, function(cover){

                        if(cover === '' || cover === null){
                            cover = '/music/css/img/nodata.jpg';
                        }

                        var albumMetadata = [album,artist,year,genre,cover];

                        //Store Album in DB
                        storeAlbumInDatabase(albumMetadata);
                    })
                });
            });

        }
    });
    parser.on('done', function(err) {
        if (err){
            console.log("err", err);
        }
        if (callback) {
            callback();
        }
    });
};


getTrackFromDB = function(title, callback){
    db.query('SELECT * FROM tracks WHERE title =? ', [ title ], {
            title             : String,
            track             : Number,
            album             : String,
            artist          : String,
            year            : Number,
            genre           : String,
            filename        : String,
            filepath        : String
        },
        function(err,rows) {
            if(err){
                console.log('DB error', err);
                db.query("CREATE TABLE IF NOT EXISTS tracks (title TEXT PRIMARY KEY, track INTEGER, album TEXT, artist TEXT, year INTEGER, genre TEXT, filename TEXT, filepath TEXT)");
            }
            if (typeof rows !== 'undefined' && rows.length > 0){
                callback(rows);
            } else {
                callback(null);
            }
        }
    );
}

storeTrackInDB = function(metadata, callback){
    db.query('INSERT OR REPLACE INTO tracks VALUES(?,?,?,?,?,?,?,?)', metadata);
    callback();
}

storeAlbumInDatabase = function(metadata, callback){
    db.query('INSERT OR REPLACE INTO albums VALUES(?,?,?,?,?)', metadata);

    nrScanned++;

    var perc = parseInt((nrScanned / totalFiles) * 100);
    var increment = new Date(), difference = increment - start;
    if (perc > 0) {
        var total = (difference / perc) * 100, eta = total - difference;
        //console.log('Item '+nrScanned+' of '+totalFiles+', '+perc+'% done \r');
        console.log(perc);
    }

    if(nrScanned === totalFiles){
        var stop = new Date();
        console.log("Scan complete! Time taken:", UMS((stop - start) / 100, true));
        process.exit();
    }

}

getAlbumFromDB = function (album, callback){
    db.query('SELECT * FROM albums WHERE album =? ', [ album ], {
            album             : String,
            artist          : String,
            year            : Number,
            genre           : String,
            cover           : String
        },
        function(err,rows) {
            if(err){
                console.log('DB error', err);
                db.query("CREATE TABLE IF NOT EXISTS albums (album TEXT PRIMARY KEY, artist TEXT, year INTEGER, genre TEXT, cover VARCHAR)");
            }
            if (typeof rows !== 'undefined' && rows.length > 0){
                callback(rows);
            } else {
                callback(null);
            }
        }
    );
}


getAdditionalDataFromLastFM = function(album, artist, callback) {
    // Currently only the cover is fetched. Could be expanded in the future
    // Due to the proper caching backend provided by LastFM there is no need to locally store the covers.
    //var apiUrl = "http://www.mediacenterjs.com/global/js/musickey.js";
    var lastfm = new LastfmAPI({
        'api_key'   : "36de4274f335c37e12395286ec6e92c4",
        'secret'    : "1f74849490f1872c71d91530e82428e9"
    });

    var cover = '/music/css/img/nodata.jpg';

    lastfm.album.getInfo({
        'artist'    : artist,
        'album'     : album
    }, function(err, album){
        if(err){
            callback(cover);
        }

        if(album !== undefined && album.image[0] !== undefined && album.image[0] !== null){
            cover = album.image[3]["#text"];

            if(cover !== ''){
                callback(cover);
            } else {
                callback(cover);
            }
        }

    });
}


walk(dir,  function(err, results) {
    totalFiles = (results) ? results.length : 0;
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
