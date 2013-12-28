/* Global imports */
var colors = require('colors')
	, ffmpeg = require('fluent-ffmpeg')
	, os = require('os')
	, fs = require('fs.extra')
	, config = require('../../lib/handlers/configuration-handler').getConfiguration()
	, probe = require('node-ffprobe')
	, dblite = require('dblite');

/* Public Methods */

/**
 * Starts video streaming for the specified Movie-File.
 * @param response          The response to write the video stream to
 * @param movieUrl          The URL to the Movie
 * @param movieFile         The Movie-File
 * @param platform          The target platform
 */
exports.startPlayback = function(response, movieUrl, movieFile, platform) {
	var ExecConfig = {  maxBuffer: 9000*1024 }
	, outputPath = "./public/data/movies/output.mp4";
	
	if(os.platform() === 'win32'){
		var ffmpegPath = './bin/ffmpeg/ffmpeg.exe'
		ExecConfig = {  maxBuffer: 9000*1024, env: process.env.ffmpegPath };
	}

	if(fs.existsSync(outputPath) === true){
		fs.unlinkSync(outputPath);
	};       

	probe(movieUrl, function(err, probeData) {
		if(probeData.streams[0].duration !== 0 || probeData.streams[0].duration !== undefined || probeData.streams[0].duration !== 'N/A' ){
			var data = { 
				'platform': platform,
				'duration':probeData.streams[0].duration
			}
		} else {
			if(os.platform() === 'win32'){
				dblite.bin = "./bin/sqlite3/sqlite3";
			}
			var db = dblite('./lib/database/mcjs.sqlite');
			db.on('info', function (text) { console.log(text) });
			db.on('error', function (err) { console.error('Database error: ' + err) });
			db.query('SELECT * FROM movies WHERE local_name =? ', [ movieRequest ], {
					runtime : String,
				},
				function(rows) {
					if (typeof rows !== 'undefined' && rows.length > 0){
						var data = { 
							'platform': platform,
							'duration': rows.runtime
						}
						response.json(data);  
					} else {
						console.log('Unknow movie duration, falling back to estimated duration.' .red);
						var data = { 
							'platform': platform,
							'duration': 9000
						}
						response.json(data);  
					}
				}
			);
		}
			
		switch (platform) {
			case "browser":
				var ffmpeg = 'ffmpeg -i "'+movieUrl+'" -g 52 -threads 0 -vcodec libx264 -coder 0 -flags -loop -pix_fmt yuv420p -crf 22 -subq 0 -preset ultraFast -acodec copy -sc_threshold 0 -movflags +frag_keyframe+empty_moov '+outputPath
				break;
			case "android":
				var ffmpeg = 'ffmpeg -i "'+movieUrl+'" -g 52 -threads 0 -vcodec libx264 -coder 0 -flags -loop -pix_fmt yuv420p -crf 22 -subq 0 -sc_threshold 0 -vb 250k -s 1280x720 -profile:v baseline -keyint_min 150 -deinterlace -c:a mp3 -movflags +frag_keyframe+empty_moov '+outputPath
				break;
			case "ios":
				var ffmpeg = 'ffmpeg -i "'+movieUrl+'" -g 52 -threads 0 -vcodec libx264 -coder 0 -flags -loop -pix_fmt yuv420p -crf 22 -subq 0 -preset ultraFast -acodec mp3 -ac 2 -ab 160k -sc_threshold 0 -movflags +frag_keyframe+empty_moov '+outputPath
				break;
			default:
				console.log("Unknown platform: " + platform .red);
				break;
		}
		
		
		var exec = require('child_process').exec
		, child = exec(ffmpeg, ExecConfig, function(err, stdout, stderr) {
			if (err) {
				console.log('FFMPEG error: ',err) ;
			} else{
				console.log('Transcoding complete');
			}
		});

		child.stdout.on('data', function(data) { console.log(data.toString()); });
		child.stderr.on('data', function(data) { console.log(data.toString()); });			

	});
};
