
/* Modules */
var express = require('express')
, app = express()
, fs = require('fs')
, discogs = require('discogs')
, client = discogs({api_key: 'qXZoSCiTdtLSWknszOtk'});

exports.engine = 'jade';

var configfile = []
,configfilepath = './configuration/setup.js'
,configfile = fs.readFileSync(configfilepath)
,configfileResults = JSON.parse(configfile);	
 
// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
exports.engine = 'jade';


/*
var Controller = {
  handlePlaylist: function(req, res) {
    if (!songs) {
      songs = Playlist.getSong(req.param('playlist'));
    }
    var index = req.param('song');
    if (index && index >= 0 && index < songs.length) {
      return res.send({ 'result': MUSIC_PATH + 'kpop/' + songs[index] });
    }
    return res.send({ 'filenames': songs });
  }
};
*/


// Render the indexpage
exports.index = function(req, res, next){	
	updateMusic(req, res, function(status){
		var musicfiles = []
		,musicfilepath = './public/music/data/musicindex.js'
		,musicfiles = fs.readFileSync(musicfilepath)
		,musicfileResults = JSON.parse(musicfiles)	
		
		res.render('music',{
			music: musicfileResults,
			status:status
		});
	});
};


//TODO: Make this a generic helper function
function updateMusic(req, res, callback) { 
	var musiclistpath = './public/music/data/musicindex.js'
	, status = null
	, dir = configfileResults.musicpath;
	
	console.log('Getting music from:', dir)
	fs.readdir(dir,function(err,files){
		if (err){
			status = 'wrong or bad directory, please specify a existing directory';
			console.log(status);
			callback(status);
		}else{
			var allMusic = new Array();
			files.forEach(function(file){
				var fullPath = dir + file
				stats = fs.lstatSync(fullPath);
				if (stats.isDirectory(file)) {
					var subPath = dir + file
					, files = fs.readdirSync(subPath);
					console.log('found album', file)
					allMusic.push(file);
				} else {
					if (file.match(/\.(mp3)/)){
						musicFiles = file
						allMusic[allMusic.length] = musicFiles;
					}
				}
			});
			var allMusicJSON = JSON.stringify(allMusic, null, 4);
			fs.writeFile(musiclistpath, allMusicJSON, function(e) {
				if (!e) {
					console.log('Updating musiclist', allMusicJSON);
					callback(status);
				}else{ 
					console.log('Error getting musiclist', e);
				};
			});
		};
	});
};


