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
 * Starts video streaming for the specified file.
 * @param response          The response to write the video stream to
 * @param url               The URL to the file
 * @param file              The File
 * @param subtitleUrl       The URL to the subtitle file
 * @param subtitleTitle     The filename ofthe subtitle file
 * @param type              The type for which the playback needs to be started (eg, tv or movie)
 */
exports.startPlayback = function(response,platform, url, file, subtitleUrl, subtitleTitle, type) {
    console.log('Getting ready to start playing '+file+' on '+platform);
    var fileName =  file.replace(/\.[^.]*$/,'')
    , outputName =  fileName.replace(/ /g,"-")
    , ExecConfig = {  maxBuffer: 9000*1024 }
    , outputPath = "./public/data/"+type+"/"+outputName+".mp4"
    , hasSub = false;

    getDuration(response, url, file, type, function(data){
        var duration = data;

        // Check if subtitles exist and write them to data folder
        if(fs.existsSync(subtitleUrl)){
            var subOutput = "./public/data/movies/"+subtitleTitle;
            fs.writeFileSync(subOutput, fs.readFileSync(subtitleUrl));
            hasSub = true;
        }

        checkProgression(file, function(data){
            var progression = data.progression;

            if(data.transcodingstatus === 'pending' || data.transcodingstatus === undefined){
                console.log('Previously transcoding of this file was not completed');
                fs.exists("./public/data/", function(dataExists) {
                    if (!dataExists) {
                        fs.mkdirSync("./public/data/");
                    }
                    fs.exists("./public/data/"+type+"/", function(exists){
                        if(!exists){
                            fs.mkdirSync("./public/data/"+type);
                        }

                        fs.exists(outputPath, function(exists){
                            if(exists){
                                fs.unlinkSync(outputPath);
                            }

                            if(fs.existsSync(url)){
                                startTranscoding(response,url,platform, file, outputPath, ExecConfig);
                            } else{
                                console.log('File '+ url + 'not found, did you move or delete it?');
                            }
                        });

                    });
                });

            } else {
                console.log('File '+file+' already trancoded with quality level: '+config.quality +'. Continuing with playback.');
            }

            var fileInfo = {
                'duration'      : duration,
                'progression'   : progression,
                'subtitle'      : hasSub
            }

            response.json(fileInfo);

        });
    });
};

/* Private Methods */

getDuration = function(response, url, file, type, callback) {
    var probe = require('node-ffprobe');
    probe(url, function(err, probeData) {
        if(!err){
            if(probeData !== undefined || probeData.streams[0].duration !== 0 && probeData.streams[0].duration !== undefined && probeData.streams[0].duration !== "N/A" ){
                console.log('Found duration "'+probeData.streams[0].duration+'" in metadata, continuing...');
                var data = probeData.streams[0].duration;
                callback(data);
            } else if(type === 'movie'){
                console.log('Falling back to database runtime information' .blue);
                getDurationFromDatabase(file, function(data){
                    if(data !== null){
                        callback(data);
                    } else{
                        console.log('Unknown file duration, falling back to estimated duration.' .red);
                        var data = 9000;
                        callback(data);
                    }
                });

            }
        }else {
            console.log('Using fallback length due to error: ',err);
            var data = 9000;
            callback(data);
        }
    });

};

getDurationFromDatabase = function(file, callback) {
    var original_title =  file.replace(/(avi|mkv|mpeg|mpg|mov|mp4|wmv)$/,"")

    db.query('SELECT * FROM movies WHERE original_name =? ', [ original_title ], {
        local_name      : String,
        original_name   : String,
        poster_path     : String,
        backdrop_path   : String,
        imdb_id         : String,
        rating          : String,
        certification   : String,
        genre           : String,
        runtime         : String,
        overview        : String,
        cd_number       : String
    },
    function(rows) {
        if (typeof rows !== 'undefined' && rows.length > 0){
            var runtime = parseInt(rows[0].runtime) * 60;
            console.log('Runtime found', rows[0].runtime);
            var data = runtime;
            callback(data);
        } else {
            callback(null);
        }if (typeof rows !== 'undefined' && rows.length > 0){
            var runtime = parseInt(rows[0].runtime) * 60;
            console.log('Runtime found', rows[0].runtime);
            var data = runtime;
            callback(data);
        } else {
            callback(null);
        }
    });
}

checkProgression = function(file, callback) {

    var data = {
        'progression'       : 0,
        'transcodingstatus' : 'pending'
    }

    db.query('SELECT * FROM progressionmarker WHERE title =? ', [ file ], {
        movietitle          : String,
        progression         : String,
        transcodingstatus   : String
    },
    function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){
            console.log('File '+rows[0].title+' has already been played once before to marker:'+ rows[0].progression + ' status is: ' + rows[0].transcodingstatus);
            data = {
                'progression'        : rows[0].progression,
                'transcodingstatus'  : rows[0].transcodingstatus
            };
            callback(data);
        } else {
            console.log('New playback, continuing...');
            callback(data);
        }
    });
}


startTranscoding = function(response, url, platform,file, outputPath, ExecConfig){
    var ffmpeg = require('fluent-ffmpeg');

    if(os.platform() === 'win32'){
        var ffmpegPath = './bin/ffmpeg/ffmpeg.exe'
        ExecConfig = {
            maxBuffer: 9000*1024,
            env: process.env.ffmpegPath
        };
    }

    var FFMPEG_TIMEOUT = 15000;
    var MOBILE_FFMPEG_OPTS = [
        '-threads 0',
        '-loglevel quiet',
        '-ac 2',
        '-b:a 160000'];


    if(!fs.existsSync(outputPath)){
        if(platform === 'desktop'){
            browserTranscoding(response, url, platform,file, outputPath, ExecConfig);
        } else if(platform === 'android'){
            androidTranscoding(response, url, platform,file, outputPath, ExecConfig, ffmpeg, MOBILE_FFMPEG_OPTS, ffmpegPath, FFMPEG_TIMEOUT);
        } else if(platform === 'ios'){
            iosTranscoding(response, url, platform,file, outputPath, ExecConfig, ffmpeg, MOBILE_FFMPEG_OPTS, ffmpegPath, FFMPEG_TIMEOUT);
        }
    }
}

browserTranscoding = function(response, url, platform,file, outputPath, ExecConfig){

    if(config.quality === 'lossless' ){

        var TRANSCODING_OPTS = [
            '-threads 0',
            '-vcodec libx264',
            '-coder 0',
            '-flags -loop',
            '-pix_fmt yuv420p',
            '-crf 0',
            '-subq 0',
            '-sc_threshold 0',
            '-profile:v baseline',
            '-keyint_min 150',
            '-deinterlace -maxrate 10000000',
            '-bufsize 10000000',
            '-acodec aac',
            '-strict experimental',
            '-frag_duration 1000',
            '-movflags +frag_keyframe+empty_moov'
        ];

    } else if (config.quality === 'high' || config.quality === undefined){

        var TRANSCODING_OPTS = [
            '-g 52',
            '-threads 0',
            '-vcodec libx264',
            '-coder 0',
            '-flags -loop',
            '-pix_fmt yuv420p',
            '-crf 22',
            '-subq 0',
            '-sc_threshold 0',
            '-profile:v baseline',
            '-keyint_min 150',
            '-deinterlace -maxrate 10000000',
            '-bufsize 10000000',
            '-acodec aac',
            '-ar 48000',
            '-ab 320k',
            '-strict experimental',
            '-frag_duration 1000',
            '-movflags +frag_keyframe+empty_moov'
        ];

    } else if (config.quality === 'medium'){

        var TRANSCODING_OPTS = [
            '-g 52',
            '-threads 0',
            '-vcodec libx264',
            '-coder 0',
            '-flags -loop',
            '-pix_fmt yuv420p',
            '-crf 25',
            '-subq 0',
            '-sc_threshold 0',
            '-s 1280x720',
            '-profile:v baseline',
            '-keyint_min 150',
            '-deinterlace -maxrate 10000000',
            '-bufsize 10000000',
            '-acodec aac',
            '-ar 48000',
            '-ab 192k',
            '-strict experimental',
            '-frag_duration 1000',
            '-movflags +frag_keyframe+empty_moov'
        ];

    } else if (config.quality === 'low'){

        var TRANSCODING_OPTS = [
            '-g 52',
            '-threads 0',
            '-vcodec libx264',
            '-coder 0',
            '-flags -loop',
            '-pix_fmt yuv420p',
            '-crf 30',
            '-subq 0',
            '-sc_threshold 0',
            '-s 720x480',
            '-profile:v baseline',
            '-keyint_min 150',
            '-deinterlace -maxrate 10000000',
            '-bufsize 10000000',
            '-acodec aac',
            '-ar 48000',
            '-ab 128k',
            '-strict experimental',
            '-frag_duration 1000',
            '-movflags +frag_keyframe+empty_moov'
        ];

    }

    var transcodingOpts = TRANSCODING_OPTS.join().replace(/,/g, " ");
    var ffmpeg = 'ffmpeg -i "'+url+'" ' + transcodingOpts + ' "'+outputPath+'"';

    console.log('Starting transcoding for', platform);

    var exec = require('child_process').exec
    , child = exec(ffmpeg, ExecConfig, function(err, stdout, stderr) {
        if (err) {
            console.log('FFMPEG error: ',err) ;
        } else{
            console.log('Transcoding complete');
            db.query('UPDATE progressionmarker SET transcodingstatus = "done" WHERE title =? ', [ file ]);
        }
    });
    child.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    child.stderr.on('data', function(data) {
        console.log(data.toString());
    });
    child.on('exit', function() {
        console.error('Child process exited');
    });

}


iosTranscoding = function(response, url, platform,file, outputPath, ExecConfig, ffmpeg, MOBILE_FFMPEG_OPTS, ffmpegPath, FFMPEG_TIMEOUT){
    console.log('Starting transcoding for', platform);
    var IOS_FFMPEG_OPTS = [
        '-vcodec libx264',
        '-pix_fmt yuv420p',
        '-s qvga',
        '-segment_list_type m3u8',
        '-map 0:v',
        '-map 0:a:0',
        '-c:a mp3',
        '-ar 44100',
        '-f hls',
        '-hls_time 10',
        '-hls_list_size 6',
        '-hls_wrap 18',
        '-start_number 1',
        '-deinterlace'].concat(MOBILE_FFMPEG_OPTS);

    response.writeHead(200, {
        'Content-Type':'application/x-mpegURL',
        'Content-Length':file.size
    });


    var proc = new ffmpeg({ source: url, nolog: true, timeout: FFMPEG_TIMEOUT })
    if(os.platform() === 'win32'){
        proc.setFfmpegPath(ffmpegPath)
    }
    proc.addOptions(MOBILE_FFMPEG_OPTS)
    proc.writeToStream(response, function(return_code, error){
    });
}

androidTranscoding = function(response, url, platform,file, outputPath, ExecConfig, ffmpeg, MOBILE_FFMPEG_OPTS, ffmpegPath, FFMPEG_TIMEOUT){
    console.log('Starting transcoding for', platform);
    response.writeHead(200, {
        'Content-Type':'video/webm',
        'Content-Length':file.size
    });

    var ANDROID_FFMPEG_OPTS = [
        '-vcodec libx264',
        '-vb 250k',
        '-s 1280x720',
        '-profile:v baseline',
        '-keyint_min 150',
        '-pix_fmt yuv420p',
        '-deinterlace',
        '-c:a mp3',
        '-f mp4',
        '-movflags',
        'frag_keyframe+empty_moov']
    .concat(MOBILE_FFMPEG_OPTS);

    var proc = new ffmpeg({ source: url, nolog: true, timeout: FFMPEG_TIMEOUT })
    if(os.platform() === 'win32'){
        proc.setFfmpegPath(ffmpegPath)
    }
    proc.addOptions(MOBILE_FFMPEG_OPTS)
    proc.writeToStream(response, function(return_code, error){
    });

}
