/* Global imports */
var colors = require('colors')
	, ffmpeg = require('fluent-ffmpeg')
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
 * @param movieUrl          The URL to the Movie
 * @param movieFile         The Movie-File
 * @param platform          The target platform
 */
exports.startPlayback = function(response, movieUrl, movieFile, platform) {


    var fileName =  movieFile.replace(/\.[^.]*$/,'')
        , outputName =  fileName.replace(/ /g,"-")
        , ExecConfig = {  maxBuffer: 9000*1024 }
        , outputPath = "./public/data/movies/"+outputName+".mp4";
		
		console.log('outputName', outputName)
	
	if(os.platform() === 'win32'){
		var ffmpegPath = './bin/ffmpeg/ffmpeg.exe'
		ExecConfig = {  maxBuffer: 9000*1024, env: process.env.ffmpegPath };
	}

    GetMovieDurarion(response, movieUrl, movieFile, platform, function(data){
        var movieDuration = data;
        checkProgression(movieFile, function(progression){
            if(progression !== 0 && progression !== undefined){
                console.log('Progression found...');
                var movieProgression = progression;

                if(fs.existsSync(outputPath) === false){
                    // Start transcode if file was deleted.
                    startTranscoding(platform, movieUrl, outputPath, ExecConfig);
                };

                //TODO: Add check to check if transcoding was completed.

            } else {
                console.log('Progression not found, starting transcode...');
                var movieProgression = 0;

                // Cleanup just to be safe
                if(fs.existsSync(outputPath) === true){
                    fs.unlinkSync(outputPath);
                };
                startTranscoding(platform, movieUrl, outputPath, ExecConfig);
            }

            var movieInfo = {
                'platform': platform,
                'duration': movieDuration,
                'progression': movieProgression
            }

            response.json(movieInfo);

        });
	});
};

/* Private Methods */

GetMovieDurarion = function(response, movieUrl, movieFile, platform, callback) {
	var probe = require('node-ffprobe');
	probe(movieUrl, function(err, probeData) {
        if(!err){
            if(probeData !== undefined || probeData.streams[0].duration !== 0 && probeData.streams[0].duration !== undefined && probeData.streams[0].duration !== "N/A" ){
                console.log('Metadata found, continuing...');
                var data = probeData.streams[0].duration;
                callback(data);
            } else {
                console.log('Falling back to IMDB runtime information' .blue);
                getDurationFromDatabase(movieFile, platform, function(data){
                    if(data !== null){
                        callback(data);
                    } else{
                        console.log('Unknown movie duration, falling back to estimated duration.' .red);
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

getDurationFromDatabase = function(movieFile, platform, callback) {
	var original_title =  movieFile.replace(/(avi|mkv|mpeg|mpg|mov|mp4|wmv)$/,"")

	db.query('SELECT * FROM movies WHERE original_name =? ', [ original_title ], {
			local_name 		: String,
			original_name   : String,
			poster_path  	: String,
			backdrop_path   : String,
			imdb_id  		: String,
			rating  		: String,
			certification   : String,
			genre  			: String,
			runtime  		: String,
			overview  		: String,
			cd_number  		: String
		},
		function(rows) {
			if (typeof rows !== 'undefined' && rows.length > 0){
				var runtime = parseInt(rows[0].runtime) * 60;
				console.log('Runtime found', rows[0].runtime);
				var data = runtime;
                callback(data);
			} else {
				callback(null);
			}
		}
	);
}

checkProgression = function(movieFile, callback) {
    db.query('SELECT * FROM progressionmarker WHERE movietitle =? ', [ movieFile ], {
            movietitle 		: String,
            progression     : String
        },
        function(rows) {
            if (typeof rows !== 'undefined' && rows.length > 0){
                var progression = rows[0].progression;
                callback(progression);
            } else {
                callback(0);
            }
        }
    );
}


startTranscoding = function(platform, movieUrl, outputPath, ExecConfig){
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
}