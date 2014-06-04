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
    , metafetcher = require('../../lib/utils/metadata-fetcher')
	, config = require('../../lib/handlers/configuration-handler').getConfiguration()
	, music_playback_handler = require('./music-playback-handler'); 

    var database = require('../../lib/utils/database-connection');
    var db = database.db;

exports.loadItems = function (req, res, serveToFrontEnd){
    var metaType = "music";
    var getNewFiles = true;
    if(serveToFrontEnd === false){
        fetchMusicData(req, res, metaType, serveToFrontEnd, getNewFiles);
    } else if(serveToFrontEnd === undefined || serveToFrontEnd === null){
        var serveToFrontEnd = true; 
        getCompleteCollection(req, res, metaType, serveToFrontEnd, getNewFiles);
    } else {
        console.log('lookup')
        getCompleteCollection(req, res, metaType, serveToFrontEnd, getNewFiles);
    }
};

exports.playTrack = function(req, res, track, album){
	music_playback_handler.startTrackPlayback(res, track);
};

/** Private functions **/


fetchMusicData = function(req, res, metaType, serveToFrontEnd, getNewFiles) {
    if(getNewFiles !== false){       
        metafetcher.fetch(req, res, metaType, function(type){
            if(type === metaType){
                getNewFiles = false;
                setTimeout(function(){
                    console.log('Scraping done for',metaType);
                    getCompleteCollection(req, res, metaType, serveToFrontEnd, getNewFiles);
                },3000);
            }
        }); 
    }
}


getCompleteCollection = function(req, res, metaType, serveToFrontEnd, getNewFiles){ 
    getAlbums(req, res, function(result){
        var count   = result.length;
        var albums  = [];
        if(result !== 'none' && result !== null && count > 0) {
            console.log('Found ' + count + ' albums, continuing...');
            result.forEach(function (item, value) {

                if (item !== null && item !== undefined) {
                    var album       = item.album
                    , artist    = item.artist
                    , year      = item.year
                    , genre     = item.genre
                    , cover     = item.cover;

                    getTracks(album, artist, year, genre, cover, function (completeAlbum){
                        if(completeAlbum !== 'err'){
                            count--;
                            albums.push(completeAlbum);
                            if (count == 0) {
                                if(serveToFrontEnd === true){
                                    console.log('Sending data to client...');
                                    return res.json(albums);
                                    res.end();
                                }
                            } 
                        } else {
                            console.log('Error retrieving tracks...');
                        }
                    });
                }
            });
        } else if( getNewFiles === true){
            fetchMusicData(req, res, metaType, serveToFrontEnd, getNewFiles);
        }
    }); 
}

getAlbums = function(req, res, callback){
    db.query('SELECT * FROM albums ORDER BY album asc', {
        album   : String,
        artist  : String,
        year    : Number,
        genre   : String,
        cover   : String
    },
    function(err, rows) {
        if(err){
            callback('none');
        } else if (rows !== undefined && rows !== null ){
            callback(rows);
        } else {
            callback('none');
        }
    });
}

getTracks = function (album, artist, year, genre, cover, callback){
    db.query('SELECT * FROM tracks WHERE album = $album ORDER BY track asc ', { album: album }, {
            title       : String,
            track       : Number,
            album       : String,
            artist      : String,
            year        : Number,
            genre       : String,
            filename    : String
        },
        function (err, rows) {
            if(err){
                console.log('getTracks',err);
                callback('err');
            }
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
}
