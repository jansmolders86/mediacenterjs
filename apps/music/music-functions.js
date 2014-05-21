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
var file_utils = require('../../lib/utils/file-utils')
    , os = require('os')
    , metafetcher = require('../../lib/utils/metadata-fetcher')
	, config = require('../../lib/handlers/configuration-handler').getConfiguration()
	, music_playback_handler = require('./music-playback-handler'); 

// Init Database
var dblite = require('dblite')
if(os.platform() === 'win32'){
    dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');
db.on('info', function (text) { console.log('Database info:', text) });
db.on('error', function (err) { console.error('Database error: ' + err) });

exports.loadItems = function (req, res, serveToFrontEnd){
    var metaType = "music";
    if(serveToFrontEnd == false){
        fetchMusicData(req, res, metaType, serveToFrontEnd);
    } else{
        serveToFrontEnd = true; 
        fetchMusicData(req, res, metaType, serveToFrontEnd);
    }
};

exports.playTrack = function(req, res, track, album){
	music_playback_handler.startTrackPlayback(res, track);
};

/** Private functions **/


fetchMusicData = function(req, res, metaType, serveToFrontEnd) {
    var count = 0;
    metafetcher.fetch(req, res, metaType, function(type){
        if(type === metaType){
			getAlbums(function(rows){
		        if(rows !== null) {
                    var albums = [];

                    count = rows.length;
                    console.log('Found ' + count + ' albums, getting additional data...');
                    rows.forEach(function (item, value) {

                        if (item !== null && item !== undefined) {
                            var album       = item.album
                                , artist    = item.artist
                                , year      = item.year
                                , genre     = item.genre
                                , cover     = item.cover;

                            getTracks(album, artist, year, genre, cover, function (completeAlbum) {
                                count--;
                                albums.push(completeAlbum);
                                if (count == 0) {
                                    console.log('Sending data to client');
                                    if(serveToFrontEnd === true){
                                        return res.json(albums);
                                        res.end();
                                    }
                                }
                            });
                        }

                    });
                } 
            });
        }
	});
}

getAlbums = function(callback){
    console.log('Looking for stored albums.');
	setTimeout(function(){
        db.query('SELECT * FROM albums ORDER BY album asc', {
            album   : String,
            artist  : String,
            year    : Number,
            genre   : String,
            cover   : String
        },
        function(err, rows) {
            if(err) console.log('Database error: ' + err);

            if (rows !== undefined && rows !== null ){
                if(rows.length > 0){
                    console.log('Found albums...');
                    callback(rows);
                } else {
                    console.log('No albums found... Indexing.');
                    callback(null);
                }
            } else {
                console.log('No albums found... Indexing.');
                callback(null);
            }
        });
	},300);
}

getTracks = function (album, artist, year, genre, cover, callback){
    setTimeout(function() {
        db.query('SELECT * FROM tracks WHERE album = $album ORDER BY track asc ', { album: album }, {
                title       : String,
                track       : Number,
                album       : String,
                artist      : String,
                year        : Number,
                genre       : String,
                filename    : String
            },
            function (rows) {
                if (typeof rows !== 'undefined' && rows.length > 0) {
                    var completeAlbum = {
                        "album"     : album,
                        "artist"    : artist,
                        "year"      : year,
                        "genre"     : genre,
                        "cover"     : cover,
                        "tracks"    : rows
                    }

                    callback(completeAlbum);
                }
            }
        );
    },500);
}