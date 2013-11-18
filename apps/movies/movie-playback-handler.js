/* Global imports */
var colors = require('colors'),
	ffmpeg = require('fluent-ffmpeg'),
	probe = require('node-ffprobe');

/* Constants */
var FFMPEG_TIMEOUT = 15000;
var BROWSER_FFMPEG_OPTS = [
	'-y',
	'-loglevel quiet',
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
	'-crf 23',
	'-f flv'];

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
		'Content-Type':'video/flv', 
		'Content-Length': movieFile.size
	});

	probe(movieUrl, function(err, probeData) {

		var metaDuration = "", 
		tDuration = "";
		if(probeData !== undefined && probeData.streams[0].duration !== 0 && probeData.streams[0].duration !== 'N/A'){
			var metaDuration =  '-metadata duration="' + probeData.streams[0].duration + '"',
			tDuration =  '-t ' + probeData.streams[0].duration;
		} else 	if(probeData !== undefined && probeData.streams[1].duration !== 0 && probeData.streams[1].duration !== 'N/A'){
			var metaDuration =  '-metadata duration="' + probeData.streams[1].duration + '"',
			tDuration =  '-t ' + probeData.streams[1].duration;
		}
	
		var videoBitrate = '-b:v 1024';
		var maxRate  = '-maxrate 1024'
		var minRate  = '-maxrate 1024'
		var bufSize = '-bufsize 1024'
		if(probeData !== undefined && probeData.streams[1].bit_rate !== 0 && probeData.streams[1].bit_rate !== 'N/A'){
			var bitrate = probeData.streams[1].bit_rate
			videoBitrate = '-b:v '+ bitrate;
			maxRate  = '-maxrate '+ bitrate;
			bufSize = '-bufsize '+ bitrate / 2;
		}
		
		/*
		var fps = '';
		if(probeData.streams[1].r_frame_rate !== 0){
			var fpsRateRaw = probeData.streams[1].r_frame_rate;
			console.log(fpsRateRaw);
			var fpsRate = fpsRateRaw.replace(/[^\/]*,'');
			console.log(fpsRate);
			fps = '-r '+ fpsRate;
			console.log(fps);
		}*/
		
		var resolution = '';
		if(probeData !== undefined && probeData.streams[1].width !== 0 && probeData.streams[1].height !== 0 && probeData.streams[1].width !== undefined && probeData.streams[1].height !== undefined && probeData.streams[1].width !== 'N/A' && probeData.streams[1].height !== 'N/A'){
			// Currently, we scale back 1080p playback due to performance issues
			if(probeData.streams[1].height > 720){
				resolution = '-s 1280x720';
			} else {
				resolution = '-s '+ probeData.streams[1].width+'x'+probeData.streams[1].height;
			}
		}
		
		var audioBitrate = '-ab 160000'
		if(probeData !== undefined && probeData.streams[0].bit_rate !== 0 && probeData.streams[0].bit_rate !== 'N/A'){
			audioBitrate = '-ab '+ probeData.streams[0].bit_rate;
		}
		
		var audioChannels = '-ac 2'
		if(probeData !== undefined && probeData.streams[0].channels !== 0 && probeData.streams[0].channels !== undefined && probeData.streams[0].channels !== 'N/A'){
			audioBitrate = '-ac '+ probeData.streams[0].channels ;
		}
		
		var audioSampleRate = '-ar 44100';
		if(probeData !== undefined && probeData.streams[0].sample_rate !== 0 && probeData.streams[0].sample_rate < 44101 && probeData.streams[0].sample_rate !== 'N/A'){
			audioSampleRate = '-ar '+ probeData.streams[0].sample_rate;
		}
		
		console.log('Movie settings based on Metadata: \n MaxRate:'+maxRate +' \n BufferSize:'+bufSize+' \n BitRate: '+videoBitrate+'\n Duration: '+tDuration )
		
		var BROWSER_FFMPEG_OPTS = [
		'-y',
		'-loglevel quiet',
		'-ss 0',
		'-threads 0',
		'-vcodec libx264',
		'-pix_fmt yuv420p',
		'-profile:v baseline',
		maxRate,
		bufSize,
		videoBitrate,
		'-r 24',//TODO make dynamic
		resolution,
		'-acodec mp3',
		audioBitrate,
		audioSampleRate,
		audioChannels,
		'-qmax 1',
		'-rtbufsize 1000', 
		//'-deinterlace',
		//'-crf 22',
		metaDuration, 
		tDuration,
		'-g 10',
		'-f flv'];
		startMovieStreaming(response, movieUrl, BROWSER_FFMPEG_OPTS);

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
