/* Global imports */
var colors = require('colors'),
	ffmpeg = require('fluent-ffmpeg'),
	probe = require('node-ffprobe');

/* Constants */
var FFMPEG_TIMEOUT = 15000;
var BROWSER_FFMPEG_OPTS = [
	'-y',
	'-ss 0',
	'-threads 0',
	'-vcodec libx264',
	'-pix_fmt yuv420p',
	'-profile:v main',
	'-b:v 512k',
	'-acodec mp3',
	'-ab 160000',
	'-ar 44100',
	'-qmax 2',
	'-rtbufsize 1000k', 
	'-maxrate 620k',
	'-deinterlace',
	'-crf 20',
	'-f flv'];

var MOBILE_FFMPEG_OPTS = [
	'-threads 0', 
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
	'-vcodec libvpx', 
	'-vb 250k', 
	'-keyint_min 150', 
	'-g 150', 
	'-c:a libvorbis', 
	'-f webm']
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
		'Content-Type':'video/flv', 
		'Content-Length': movieFile.size
	});

	probe(movieUrl, function(err, probeData) {
		if (err){
			console.log('Can not probe movie for metadata', err .red)
		} else {
			var metaDuration =  '-metadata duration="' + probeData.streams[0].duration + '"',
				tDuration =  '-t ' + probeData.streams[0].duration;

			startMovieStreaming(response, movieUrl, BROWSER_FFMPEG_OPTS.concat([metaDuration, tDuration]));
		}
	});
};

startIOSPlayback = function(response, movieUrl, movieFile) {
	response.writeHead(200, { 
		'Content-Type':'application/x-mpegURL', 
		'Content-Length':movieFile.size	
	});

	startMovieStreaming(response, movieUrl, IOS_FFMPEG_OPTS);
};

startAndroidPlayback = function(response, movieUrl, movieFile) {
	response.writeHead(200, { 
		'Content-Type':'video/webm', 
		'Content-Length':movieFile.size
	});

	startMovieStreaming(response, movieUrl, ANDROID_FFMPEG_OPTS);
};

startMovieStreaming = function(response, movieUrl, opts) {
	new ffmpeg({ source: movieUrl, nolog: true, timeout: FFMPEG_TIMEOUT })
		.addOptions(opts)
		.writeToStream(response, function(return_code, error){
			if (!error){
				console.log('file has been converted successfully', return_code);
			} else {
				console.log('file conversion error', error .red);
			}
		});
};
