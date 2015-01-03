exports.transcode = function(mediaID, type, response, url, file, outputPath, ExecConfig, CurrentTranscodings) {
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
        '-deinterlace',
        '-threads 0',
        '-loglevel quiet',
        '-ac 2',
        '-b:a 160000'];

    response.writeHead(200, {
        'Content-Type': 'application/x-mpegURL',
        'Content-Length': file.size
    });


    var proc = new ffmpeg({ source: url, nolog: true, timeout: 15000 });
    if (os.platform() === 'win32') {
        proc.setFfmpegPath(process.env.ffmpegPath);
    }

    proc.addOptions(IOS_FFMPEG_OPTS);
    proc.writeToStream(response, function(return_code, err) {
        if (err) {
            logger.error(err);
        }
    });
};
