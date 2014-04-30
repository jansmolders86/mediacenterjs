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

exports.loadItems = function(req, res, serveToFrontEnd){
    getAlbums(function(rows){
        if(rows !== null) {
            var albums = [];

            var count = rows.length;
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
                            if(serveToFrontEnd !== false){
                                console.log('Sending data to client');
                                return res.json(albums);
                                res.end();
                            }
                            if(serveToFrontEnd === null){
                                serveToFrontEnd = false;
                            }
                            fetchMusicData(req, res, serveToFrontEnd);
                        }
                    });
                }

            });
        } else {
            if(serveToFrontEnd === null){
                serveToFrontEnd = true;
            }
            fetchMusicData(req, res, serveToFrontEnd);
        }
    });
};

exports.playTrack = function(req, res, track, album){
	music_playback_handler.startTrackPlayback(res, track);
};

/** Private functions **/


fetchMusicData = function(req, res, serveToFrontEnd) {
    var count = 0;
	var dataType = 'music';
    metafetcher.fetch(req, res, dataType, function(type){
        if(type === dataType){
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
                console.log(rows);
                if(rows.length > 0){
                    console.log('Found albums...');
                    callback(rows);
                }
            } else {
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