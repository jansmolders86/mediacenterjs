/* Global Imports */
var fs = require('fs.extra')
	, file_utils = require('../../lib/utils/file-utils')
	, colors = require('colors')
	, os = require('os')
    , path = require('path')
    , metafetcher = require('../../lib/utils/metadata-fetcher')
	, config = require('../../lib/handlers/configuration-handler').getConfiguration();

var metaType = "tv";

var dblite = require('dblite')
if(os.platform() === 'win32'){
    dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');
db.on('info', function (text) { console.log(text) });
db.on('error', function (err) { console.error('Database error: ' + err) });

//Create tables
db.query("CREATE TABLE IF NOT EXISTS progressionmarker (title TEXT PRIMARY KEY, progression TEXT, transcodingstatus TEXT)");

exports.fetchData = function (req, res){
    metafetcher.fetch(req, res, metaType, function(state){
        if(state === 'done'){
            console.log('Movie index up to date');
        }
    });
};

exports.loadTvShow = function (req, res){
    db.query('SELECT * FROM tvshows',{
            title 		    : String,
            banner        	: String,
            genre         	: String,
            certification  	: String
        },
        function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){
                res.json(rows);
                fetchData(req, res, metaType);
            } else {
                console.log('Fetching tvshows');
                fetchData(req, res, metaType);
            }
        }
    );
};

exports.loadTvEpisodes = function (req, res, tvShow){
    db.query('SELECT * FROM tvepisodes WHERE title =? ', [ tvShow ], {
            localName   : String,
            title  	    : String,
            season    	: String,
            episode  	: String
        },
        function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){
                res.json(rows);
            }
        }
    );
};


exports.playEpisode = function (req, res, tvShowRequest){
    file_utils.getLocalFile(config.tvpath, tvShowRequest, function(err, file) {
        if (err) console.log(err .red);
        if (file) {
            var tvShowUrl = file.href
            , tvShow_playback_handler = require('./tv-playback-handler');

            tvShow_playback_handler.startPlayback(res, tvShowUrl, tvShowRequest);

        } else {
            console.log("File " + tvShowRequest + " could not be found!" .red);
        }
    });
};

exports.sendState = function (req, res){
    var incommingData = req.body
    , tvShowTitle = incommingData.tvShowTitle
    , progression = incommingData.currentTime
    , transcodingstatus = 'pending';

    db.query('INSERT OR REPLACE INTO progressionmarker VALUES(?,?,?)', [tvShowTitle, progression, transcodingstatus]);
};


/** Private functions **/

fetchData = function(req, res, metaType) {
    metafetcher.fetch(req, res, metaType, function(state){
        if(state === 'done'){
            db.query('SELECT * FROM tvshows',{
                title 		    : String,
                banner        	: String,
                genre         	: String,
                certification  	: String
            }, function(rows) {
                if (typeof rows !== 'undefined' && rows.length > 0){
                    // TODO: Update frontend
                    // res.json(rows);
                } else {
                    console.log('Could not index any tv shows, please check given movie collection path');
                }
            });
        }
    });
}