/* Global imports */
var colors = require('colors'),
	ffmpeg = require('fluent-ffmpeg'),
    fs = require('fs'),
	os = require('os'),
	config = require('../../lib/handlers/configuration-handler').getConfiguration();

/* Constants */
var FFMPEG_TIMEOUT = 15000;

var MOBILE_FFMPEG_OPTS = [
	'-threads 0', 
	'-loglevel quiet',
	'-ac 2', 
	'-b:a 160000'];

var IOS_FFMPEG_OPTS = [
	'-vcodec libx264',
	'-pix_fmt yuv420p',
	'-s qvga',
	'-segment_list_type m3u8',
	'-map 0:v',
	'-map 0:a:0',
	'-c:a mp3',
	'-f hls',
	'-hls_time 10',
	'-hls_list_size 6',
	'-hls_wrap 18',
	'-start_number 1',
	'-deinterlace'].concat(MOBILE_FFMPEG_OPTS);

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

/* Public Methods */

/**
 * Starts video streaming for the specified Movie-File.
 * @param response          The response to write the video stream to
 * @param movieUrl          The URL to the Movie
 * @param movieFile         The Movie-File
 * @param platform          The target platform
 */
exports.startPlayback = function(response, movieUrl, movieFile, platform) {
	console.log('Getting ready to play on ' + platform);
	switch (platform) {
		case "browser":
			startBrowserPlayback(response, movieUrl, movieFile);
			break;
		case "ios":
			startIOSPlayback(response, movieUrl, movieFile);
			break;
		case "android":
			startAndroidPlayback(response, movieUrl, movieFile);
			break;
		default:
			console.log("Unknown platform: " + platform .red);
			break;
	}
};

/* Private Methods */
startBrowserPlayback = function(response, movieUrl, movieFile) {
	response.writeHead(200, { 
		'Content-Type':'video/mp4',
        'Accept-Ranges': 'bytes',
		'Content-Length': movieFile.size
	});

    var BROWSER_FFMPEG_OPTS = [
        '-g 52',
        '-ss 0',
        '-threads 0',
        '-vcodec libx264',
        '-pix_fmt yuv420p',
        '-crf 22',
        '-preset ultraFast',
        '-acodec mp3',
        '-movflags +frag_keyframe+empty_moov',
        '-f mp4'
    ];
    startMovieStreaming(response, movieUrl, BROWSER_FFMPEG_OPTS);

};

startIOSPlayback = function(response, movieUrl, movieFile) {
	response.writeHead(200, { 
		'Content-Type':'application/x-mpegURL',
        'Accept-Ranges': 'bytes',
		'Content-Length':movieFile.size	
	});

    startTouchStreaming(response, movieUrl, IOS_FFMPEG_OPTS);
};

startAndroidPlayback = function(response, movieUrl, movieFile) {
	response.writeHead(200, { 
		'Content-Type':'video/webm',
        'Accept-Ranges': 'bytes',
		'Content-Length':movieFile.size
	});

    startTouchStreaming(response, movieUrl, ANDROID_FFMPEG_OPTS);
};

startMovieStreaming = function(response, movieUrl, opts) {
    var outputPath = "./public/data/movies/output.mp4";

    if(fs.existsSync(outputPath) === true){
        fs.unlinkSync(outputPath);
    };

    console.log('Start transcoding of ', movieUrl);

	if(config.binaries === 'packaged'){
		if(os.platform() === 'win32'){
			var ffmpegPath = './bin/ffmpeg/ffmpeg.exe'
		}else{
			var ffmpegPath = './bin/ffmpeg/ffmpeg'
		}
	}

    //TODO: Add quotes to fix not found issue
    var moviepath = '"'+movieUrl+'"';
    console.log('moviePath',moviepath);

	proc = new ffmpeg({ source: movieUrl, nolog: true, timeout: FFMPEG_TIMEOUT })
	proc.setFfmpegPath(ffmpegPath)
	proc.addOptions(opts)
	proc.saveToFile(outputPath, function(return_code, error){
		if (!error){
			console.log('file has been converted successfully', return_code);
		} else {
			console.log('file conversion error', error .red);
		}
	});
};

startTouchStreaming = function(response, movieUrl, opts) {
    if(config.binaries === 'packaged'){
        if(os.platform() === 'win32'){
            var ffmpegPath = './bin/ffmpeg/ffmpeg.exe'
        }else{
            var ffmpegPath = './bin/ffmpeg/ffmpeg'
        }
    }

    proc = new ffmpeg({ source: movieUrl, nolog: true, timeout: FFMPEG_TIMEOUT })
    proc.setFfmpegPath(ffmpegPath)
    proc.addOptions(opts)
    proc.writeToStream(response, function(return_code, error){
        if (!error){
            console.log('file has been converted successfully', return_code);
        } else {
            console.log('file conversion error', error .red);
        }
    });
};
