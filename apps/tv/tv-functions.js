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
    fetchData(req, res, metaType);
};

exports.loadTvShow = function (req, res){
    fetchData(req, res, metaType);
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

    //TODO: Make this a promise
    var count = 0;
    metafetcher.fetch(req, res, metaType, function(state){
        if(state === 'done'){
            db.query('SELECT * FROM tvshows',{
                title 		    : String,
                banner        	: String,
                genre         	: String,
                certification  	: String
            }, function(rows) {
                if (typeof rows !== 'undefined' && rows.length > 0){
                    var ShowList = [];

                    count = rows.length;
                    console.log('Found '+count+' shows, getting additional data...')
                    rows.forEach(function(item, value){
                        var showTitle       = item.title
                        , showBanner        = item.banner
                        , showGenre         = item.genre
                        , showCertification = item.certification;

                        getEpisodes(showTitle, showBanner, showGenre, showCertification, function(availableEpisodes){
                            ShowList.push(availableEpisodes);
                            count--;

                            if(count === 0 ){
                                res.json(ShowList);
                            }
                        });
                    });
                } else {
                    console.log('Could not index any tv shows, please check given movie collection path...');
                }
            });
        }
    });
}

function getEpisodes(showTitle, showBanner, showGenre, showCertification, callback){
    db.query('SELECT * FROM tvepisodes WHERE title =? ', [ showTitle ], {
            localName   : String,
            title  	    : String,
            season    	: String,
            episode  	: String
        },
        function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){

                var episodes = rows;

                var availableEpisodes = {
                    "title"         : showTitle,
                    "banner"        : showBanner,
                    "genre"         : showGenre,
                    "certification" : showCertification,
                    "episodes"      : episodes
                }

                callback(availableEpisodes);

            }
        }
    );
}