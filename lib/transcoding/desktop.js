var logger = require('winston');
var configuration_handler = require('../handlers/configuration-handler');
var config = configuration_handler.initializeConfiguration();

exports.transcode = function(mediaID, type, response, url, file, outputPath, ExecConfig, CurrentTranscodings) {
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

    if (config.quality === 'lossless') {
        TRANSCODING_OPTS = TRANSCODING_OPTS.concat([
            '-crf 0',
        ]);
    } else if (config.quality === 'high' || config.quality === undefined) {
        TRANSCODING_OPTS = TRANSCODING_OPTS.concat([
            '-g 52',
            '-crf 22',
            '-ar 48000',
            '-ab 320k',
        ]);
    } else if (config.quality === 'medium') {
        TRANSCODING_OPTS = TRANSCODING_OPTS.concat([
            '-g 52',
            '-crf 25',
            '-s 1280x720',
            '-ar 48000',
            '-ab 192k',
        ]);
    } else if (config.quality === 'low') {
        TRANSCODING_OPTS = TRANSCODING_OPTS.concat([
            '-g 52',
            '-crf 30',
            '-s 720x480',
            '-ar 48000',
            '-ab 128k',
        ]);
    }

    var transcodingOpts = TRANSCODING_OPTS.join(" ");
    var ffmpeg = 'ffmpeg -i "' + url + '" ' + transcodingOpts + ' "' + outputPath + '"';
    if (CurrentTranscodings.isTranscoding(url)) {
        logger.info('Already transcoding', url);
    } else {
        var exec = require('child_process').exec;
        var child = exec(ffmpeg, ExecConfig, function (err, stdout, stderr) {
            if (err) {
                logger.error('FFMPEG error: ', err);
            } else {
                logger.info('Transcoding complete');
                CurrentTranscodings.remove(url);

                var progData = { EpisodeId : mediaID };
                if (type === 'movie') {
                    progData = { MovieId : mediaID };
                }

                ProgressionMarker.find({ where: progData }).success(function (marker) {
                    marker.updateAttributes({ transcodingStatus : 'done' });
                });
            }
        });

        CurrentTranscodings.add(child, url);

        child.stdout.on('data', function (data) {
            logger.info(data.toString());
        });

        child.stderr.on('data', function (data) {
            logger.warn(data.toString());
        });

        child.on('exit', function () {
            CurrentTranscodings.remove(url);
        });
    }
};
