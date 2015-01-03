exports.transcode = function(mediaID, type, response, url, file, outputPath, ExecConfig, CurrentTranscodings) {
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
        'frag_keyframe+empty_moov',
        '-threads 0',
        '-loglevel quiet',
        '-ac 2',
        '-b:a 160000'];

    response.writeHead(200, {
        'Content-Type': 'video/webm',
        'Content-Length': file.size
    });

    var proc = new ffmpeg({ source: url, nolog: true, timeout: 15000 });
    if (os.platform() === 'win32') {
        proc.setFfmpegPath(process.env.ffmpegPath);
    }

    proc.addOptions(ANDROID_FFMPEG_OPTS);
    proc.writeToStream(response, function (return_code, err){
        if (err) {
            logger.error(err);
        }
    });
};