/* Global Imports */
var fs = require('fs.extra')
	, file_utils = require('../../lib/utils/file-utils')
	, colors = require('colors')
	, os = require('os')
    , path = require('path')
	, config = require('../../lib/handlers/configuration-handler').getConfiguration();

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
    var rootPath = path.dirname(module.parent.parent.parent.filename)
        , fileLocation = 'node '+rootPath+'/lib/utils/metadata/tv-metadata.js'
        , exec = require('child_process').exec
        , child = exec(fileLocation, { maxBuffer: 9000*1024 }, function(err, stdout, stderr) {
            if (err) {
                console.log('Metadata fetcher error: ',err) ;
            } else{
                console.log('Done scraping shows');
            }
        });

    child.stdout.on('data', function(data) { console.log(data.toString()); });
    child.stderr.on('data', function(data) { console.log(data.toString()); });
};

exports.playtvShow = function (req, res, platform, tvShowRequest){
    file_utils.getLocalFile(config.tvpath, tvShowRequest, function(err, file) {
        if (err) console.log(err .red);
        if (file) {
            var tvShowUrl = file.href
            , tvShow_playback_handler = require('./tv-playback-handler');

            tvShow_playback_handler.startPlayback(res, tvShowUrl, tvShowRequest, platform);

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

