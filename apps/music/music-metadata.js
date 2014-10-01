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
var fs = require('graceful-fs'),
    path = require('path'),
    configuration_handler = require('../../lib/handlers/configuration-handler'),
    LastfmAPI = require('lastfmapi'),
    mm = require('musicmetadata'),
    io = require('../../lib/utils/setup-socket').io;
    dbschema = require('../../lib/utils/database-schema'),
    Album = dbschema.Album,
    Artist = dbschema.Artist,
    Track = dbschema.Track,
    async = require('async');

var config = configuration_handler.initializeConfiguration();

/* Constants */

var SUPPORTED_FILETYPES = new RegExp("(m4a|mp3)$","g");

/* Public Methods */

/**
 * Fetches the Metadata for the specified Album from discogs.org.
 * @param albumTitle         The Title of the Album
 * @param callback           The Callback
 */

/* walk over a directory recursivly */
var dir = path.resolve(config.musicpath);
var walk = function(dir, done, filecallback) {
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
                    }, filecallback);
                } else {
                    var ext = file.split(".");
                    ext = ext[ext.length - 1];
                    if (ext.match(SUPPORTED_FILETYPES)) {
                        results.push(file);
                        filecallback(file);
                    }
                    next();
                }
            });
        })();
    });
};

var doParse = function(file, callback) {
    var parser = new mm(fs.createReadStream(file));

    var result = null;
    parser.on('metadata', function(md) {
        result = md;
    });
    parser.on('done', function(err) {
        if (err){
            console.log("err", err);
        } else {
            var trackName = "Unknown Title"
            ,   trackNo = ""
            ,   albumName = "Unknown Album"
            ,   genre = "Unknown"
            ,   artistName = "Unknown Artist"
            ,   year = "";

            if (result) {
                trackName = (result.title)        ? result.title.replace(/\\/g, '') : '';
                trackNo   = (result.track.no)     ? result.track.no : '';
                albumName = (result.album)        ? result.album.replace(/\\/g, '') : '';
                artistName= (result.artist[0])    ? result.artist[0].replace(/\\/g, '') : '';
                year      = (result.year)         ? new Date(result.year).getFullYear() : 0;

                if(result.genre !== undefined ){
                    var genrelist = result.genre;
                    if(genrelist.length > 0 && genrelist !== ""){
                        genre = genrelist[0];
                    }
                }
            }
            // Get cover from LastFM
            getAdditionalDataFromLastFM(albumName, artistName, function(cover) {
                if (cover === '' || cover === null) {
                    cover = '/music/css/img/nodata.jpg';
                }
                var albumData = {
                        title : albumName,
                        posterURL : cover,
                        year  : year
                    };
                var artistData = {
                    name : artistName
                }
                var trackData = {
                        title : trackName,
                        order : trackNo,
                        filePath : file
                    };
                callback({ albumData : albumData, artistData: artistData, trackData:trackData});
            });
        }
    });
};
var calledTimes = 0;
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
        artist    : artist,
        album     : album
    }, function(err, album) {
        if(err){
            callback(cover);
        }

        if(album !== undefined && album.image[0] !== undefined && album.image[0] !== null){
            cover = album.image[3]["#text"];
            callback(cover);
        }

    });
}

exports.loadData = function(donecallback) {
    var numberOfFiles = null;
    var tasksComplete = 0;

    var q = async.queue(function (data, callback) {
        var artistData = data.artistData;
        var albumData = data.albumData;
        var trackData = data.trackData;
        Artist.findOrCreate(artistData, artistData)
        .then(function (artist) {
            albumData.ArtistId = artist.id;
            return Album.findOrCreate({title : albumData.title}, albumData);
        })
        .then(function(album) {
            return album.createTrack(trackData);
        })
        .then(function(track) {
            tasksComplete++;
            callback();
        });
    }, 1);
    q.drain = function() {
        if (tasksComplete === numberOfFiles) {
            donecallback();
        }
    }
    walk(dir, function(err, results) {
        numberOfFiles = results.length;
    }, function (file) {
        doParse(file, function(data) {
            q.push(data, function () {
                var perc = tasksComplete/numberOfFiles * 100 >> 0;//Faster math.floor
                io.sockets.emit('progress',{msg:perc});
            });
        });
        
    });

}
