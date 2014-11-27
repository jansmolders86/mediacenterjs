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
, config = require('../../lib/handlers/configuration-handler').getConfiguration()
,logger = require('winston');

var CurrentTranscodings = {
    desktop : {},
    add : function (child, url, platform) {
        this.desktop[url] = child;
    },
    remove : function(url, platform) {
        delete this.desktop[url];
    },
    isTranscoding : function(url, platform) {
        return this.desktop[url] !== undefined;
    },
    stopAll : function() {
        Object.keys(this.desktop).forEach(function(key, index) {
            this[key].kill();
            delete this[key];
        }, this.desktop);
    }
};


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
exports.startPlayback = function(response,platform, mediaID, url, file, subtitleUrl, subtitleTitle, type) {
    logger.info('Getting ready to start playing '+file+' on '+platform);
    var fileName =  file.replace(/\.[^.]*$/,'')
    , outputName =  fileName.replace(/ /g,"-")
    , ExecConfig = {  maxBuffer: 9000*1024 }
    , outputPath = "./public/data/"+type+"/"+outputName+".mp4"
    , hasSub = false;

    getDuration(response, url, file, mediaID, type, function(duration){
        fs.mkdirp("./public/data/"+type+"/", function(err) {
            // Check if subtitles exist and write them to data folder
            if(fs.existsSync(subtitleUrl)){
                var subOutput = "./public/data/movies/"+subtitleTitle;
                fs.writeFileSync(subOutput, fs.readFileSync(subtitleUrl));
                hasSub = true;
            }

            checkProgression(mediaID, type, function(data){
                if(data.transcodingstatus === 'pending' || data.transcodingstatus === undefined){
                    logger.warn('Previously transcoding of this file was not completed');

                        fs.exists(outputPath, function(exists){
                            if(exists && !CurrentTranscodings.isTranscoding(url)){
                                fs.unlinkSync(outputPath);
                            }

                            if(fs.existsSync(url)){
                                startTranscoding(mediaID, type, response,url,platform, file, outputPath, ExecConfig);
                            } else{
                                logger.warn('File '+ url + 'not found, did you move or delete it?');
                            }
                        });


                } else {
                    logger.info('File '+file+' already trancoded with quality level: '+config.quality +'. Continuing with playback.');
                }

                var fileInfo = {
                    'duration'      : duration,
                    'progression'   : data.progression,
                    'subtitle'      : hasSub
                }

                if(platform === 'desktop'){
                    response.json(fileInfo);
                }
            });
        });
    });
};

exports.stopTranscoding = function() {
    CurrentTranscodings.stopAll();
}

/* Private Methods */

getDuration = function(response, url, file, mediaID, type, callback) {
    var probe = require('node-ffprobe');
    probe(url, function(err, probeData) {
        if(!err){
            if(probeData !== undefined || probeData.streams[0].duration !== 0 && probeData.streams[0].duration !== undefined && probeData.streams[0].duration !== "N/A" ){
                logger.info('Found duration "'+probeData.streams[0].duration+'" in metadata, continuing...');
                var data = probeData.streams[0].duration;
                callback(data);
            } else if(type === 'movie'){
                logger.info('Falling back to database runtime information');
                getDurationFromDatabase(mediaID, function(data){
                    if(data !== null){
                        callback(data);
                    } else{
                        logger.info('Unknown file duration, falling back to estimated duration.');
                        var data = 9000;
                        callback(data);
                    }
                });

            }
        }else {
            logger.warn('Using fallback length due to error: ',err);
            var data = 9000;
            callback(data);
        }
    });

};

getDurationFromDatabase = function(movieID, callback) {
    Movie.find(movieID)
    .success(function (movie) {
        callback(movie.runtime);
    })
    .error(function (err) {
        callback(null);
    });
}

checkProgression = function(mediaID, type, callback) {

    var findData = { EpisodeId : mediaID};
    if (type === "movie") {
        findData = { MovieId :  mediaID};
    }
    var data = {
        'progression'       : 0,
        'transcodingstatus' : 'pending'
    };
    ProgressionMarker.find({where:findData})
    .success(function (progressionmarker) {
        if (progressionmarker === null) {
            callback(data);
            return;
        }
        callback({
            progression         : progressionmarker.progression,
            transcodingstatus   : progressionmarker.transcodingStatus
        });
    })
    .error(function (err) {
        callback(data);
    });
}


startTranscoding = function(mediaID, type, response, url, platform,file, outputPath, ExecConfig){
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
            browserTranscoding(mediaID, type, response, url, platform,file, outputPath, ExecConfig);
        } else if(platform === 'android'){
            androidTranscoding(response, url, platform,file, outputPath, ExecConfig, ffmpeg, MOBILE_FFMPEG_OPTS, ffmpegPath, FFMPEG_TIMEOUT);
        } else if(platform === 'ios'){
            iosTranscoding(response, url, platform,file, outputPath, ExecConfig, ffmpeg, MOBILE_FFMPEG_OPTS, ffmpegPath, FFMPEG_TIMEOUT);
        }
    }
}

browserTranscoding = function(mediaID, type, response, url, platform,file, outputPath, ExecConfig){
    var TRANSCODING_OPTS = [
        '-threads 0',
        '-vcodec libx264',
        '-coder 0',
        '-flags -loop',
        '-pix_fmt yuv420p',
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
    if(config.quality === 'lossless' ){
        TRANSCODING_OPTS = TRANSCODING_OPTS.concat([
            '-crf 0',
        ]);
    } else if (config.quality === 'high' || config.quality === undefined){
        TRANSCODING_OPTS = TRANSCODING_OPTS.concat([
            '-g 52',
            '-crf 22',
            '-ar 48000',
            '-ab 320k',
        ]);
    } else if (config.quality === 'medium'){
        TRANSCODING_OPTS = TRANSCODING_OPTS.concat([
            '-g 52',
            '-crf 25',
            '-s 1280x720',
            '-ar 48000',
            '-ab 192k',
        ]);
    } else if (config.quality === 'low'){
        TRANSCODING_OPTS = TRANSCODING_OPTS.concat([
            '-g 52',
            '-crf 30',
            '-s 720x480',
            '-ar 48000',
            '-ab 128k',
        ]);
    }

    var transcodingOpts = TRANSCODING_OPTS.join(" ");
    var ffmpeg = 'ffmpeg -i "'+url+'" ' + transcodingOpts + ' "'+outputPath+'"';
    if (CurrentTranscodings.isTranscoding(url)) {
        logger.info('Already transcoding', url);
    } else {
        logger.info('Starting transcoding for', platform);
        var exec = require('child_process').exec
        , child = exec(ffmpeg, ExecConfig, function(err, stdout, stderr) {
            if (err) {
                logger.error('FFMPEG error: ',err) ;
            } else{
                logger.info('Transcoding complete');
                CurrentTranscodings.remove(url);
                var progData = {EpisodeId : mediaID};
                if (type === "movie") {
                    progData = {MovieId : mediaID};
                }
                ProgressionMarker.find({where: progData})
                .success(function (progressionmarker) {
                    progressionmarker.updateAttributes({
                        transcodingStatus : "done"
                    });
                });
            }
        });
        CurrentTranscodings.add(child, url);
        child.stdout.on('data', function(data) {
            logger.info(data.toString());
        });
        child.stderr.on('data', function(data) {
            logger.info(data.toString());
        });
        child.on('exit', function() {
            CurrentTranscodings.remove(url);
        });
    }
}


iosTranscoding = function(response, url, platform,file, outputPath, ExecConfig, ffmpeg, MOBILE_FFMPEG_OPTS, ffmpegPath, FFMPEG_TIMEOUT){
    logger.info('Starting transcoding for', platform);
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
    logger.info('Starting transcoding for', platform);

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

    response.writeHead(200, {
        'Content-Type':'video/webm',
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
