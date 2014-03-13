/* Global imports */
var colors = require('colors')
    , os = require('os')
    , fs = require('fs.extra')
    , config = require('../../lib/handlers/configuration-handler').getConfiguration();

var dblite = require('dblite');
if(os.platform() === 'win32'){
    dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');
db.on('info', function (text) { console.log(text) });
db.on('error', function (err) { console.error('Database error: ' + err) });

/* Public Methods */

/**
 * Starts video streaming for the specified Movie-File.
 * @param response          The response to write the video stream to
*   @param episodeUrl       The URL to the episode
 * @param episode           The episode
 */
exports.startPlayback = function(response, episodeUrl, episode) {

    var fileName =  episode.replace(/\.[^.]*$/,'')
        , outputName =  fileName.replace(/ /g,"-")
        , ExecConfig = {  maxBuffer: 9000*1024 }
        , outputPath = "./public/data/tv/"+outputName+".mp4";

    if(os.platform() === 'win32'){
        var ffmpegPath = './bin/ffmpeg/ffmpeg.exe'
        ExecConfig = {  maxBuffer: 9000*1024, env: process.env.ffmpegPath };
    }

    GetDurarion(response, episodeUrl, episode, function(data){
        var movieDuration = data;
        checkProgression(episode, function(data){
            if(data.progression !== 0 && data !== undefined){
                var movieProgression = data.progression;

                if(fs.existsSync(outputPath) === false || data.transcodingstatus === 'pending'){
                    // Start transcode if file was deleted.
                    startTranscoding(episodeUrl, episode, outputPath, ExecConfig);
                };

            } else {
                var movieProgression = 0;

                if( data.transcodingstatus === 'pending'){
                    if(fs.existsSync(outputPath) === true ){
                        fs.unlinkSync(outputPath);
                    };
                    startTranscoding(episodeUrl, episode, outputPath, ExecConfig);
                }
            }

            var movieInfo = {
                'duration': movieDuration,
                'progression': movieProgression
            }

            response.json(movieInfo);

        });
    });
};

/* Private Methods */

GetDurarion = function(response, episodeUrl, episode, callback) {
    var probe = require('node-ffprobe');
    probe(episodeUrl, function(err, probeData) {
        if(!err){
            if(probeData !== undefined || probeData.streams[0].duration !== 0 && probeData.streams[0].duration !== undefined && probeData.streams[0].duration !== "N/A" ){
                console.log('Metadata found, continuing...');
                var data = probeData.streams[0].duration;
                callback(data);
            } else {
                console.log('Unknown duration, falling back to estimated duration.' .red);
                var data = 1000;
                callback(data);
            }
        }else {
            console.log('Using fallback length due to error: ',err);
            var data = 1000;
            callback(data);
        }
    });

};



checkProgression = function(episode, callback) {
    db.query('SELECT * FROM progressionmarker WHERE movietitle =? ', [ episode ], {
            movietitle 		: String,
            progression     : String
        },
        function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){
                var data = {
                    'progression':rows[0].progression,
                    'transcodingstatus':rows[0].transcodingstatus
                };
                callback(data);
            } else {
                var data = {
                    'progression':0,
                    'transcodingstatus':'pending'
                }
                callback(data);
            }
        }
    );
}


startTranscoding = function( episodeUrl, episode, outputPath, ExecConfig){

    var ffmpeg = 'ffmpeg -i "'+episodeUrl+'" -g 52 -threads 0 -vcodec libx264 -coder 0 -flags -loop -pix_fmt yuv420p -crf 22 -subq 0 -sc_threshold 0 -s 1280x720 -profile:v baseline -keyint_min 150 -deinterlace -maxrate 10000000 -bufsize 10000000 -b 1200k -acodec aac -ar 48000 -ab 192k -strict experimental -movflags +frag_keyframe+empty_moov '+outputPath;
    var exec = require('child_process').exec
        , child = exec(ffmpeg, ExecConfig, function(err, stdout, stderr) {
            if (err) {
                console.log('FFMPEG error: ',err) ;
            } else{
                console.log('Transcoding complete');

                db.query('UPDATE progressionmarker SET transcodingstatus = "done" WHERE movietitle =? ', [ episode ]);
            }
        });

    child.stdout.on('data', function(data) { console.log(data.toString()); });
    child.stderr.on('data', function(data) { console.log(data.toString()); });
    child.on('exit', function() {  console.error('Child process exited'); });
}