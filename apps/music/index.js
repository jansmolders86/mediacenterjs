
/* Modules */
var express = require('express')
, app = express()
, fs = require('fs')
, downloader = require('downloader')
, request = require("request")
, helper = require('../../lib/helpers.js');

exports.engine = 'jade';

var configfile = []
,configfilepath = './configuration/setup.js'
,configfile = fs.readFileSync(configfilepath)
,configfileResults = JSON.parse(configfile);	
 
// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
exports.engine = 'jade';


// Render the indexpage
exports.index = function(req, res, next){	


	var dir = configfileResults.musicpath
	, writePath = './public/music/data/musicindex.js'
	, getDir = true;
	
	helper.getLocalFiles(req, res, dir, writePath, getDir, function(status){
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

// Render the indexpage
exports.getAlbum = function(req, res, next){

	console.log('req',req.body)
	var incommingFile = req.body
	, dir = incommingFile.album
	, writePath = './public/music/'+dir+'/album.js'
	, getDir = false;
	
	console.log(incommingFile)
	helper.getLocalFiles(req, res, dir, writePath, getDir, function(status){
		var musicfiles = []
		,musicfilepath = path
		,musicfiles = fs.readFileSync(musicfilepath)
		,musicfileResults = JSON.parse(musicfiles)	
		
		res.send('music',{
			music: musicfileResults,
			status:status
		});
	});
};

exports.post = function(req, res, next){	
	var albumTitle = null
	, title = 'No data found...'
	, thumb = '/movies/css/img/nodata.jpg'
	, year = 'No data found...'
	, genre = 'No data found...';

	var incommingFile = req.body
	, incommingalbumTitle = incommingFile.albumTitle
	, albumRequest = incommingalbumTitle;
	
	console.log('Getting data for album', albumRequest);
	//Check if folder already exists
	if (fs.existsSync('./public/music/data/'+albumRequest)) {
		if(fs.existsSync('./public/music/data/'+albumRequest+'/data.js')){
			fs.stat('./public/music/data/'+albumRequest+'/data.js', function (err, stats) {
				// If data file is created without data, we remove it (rm -rf using module RimRaf).
				if(stats.size == 0){
					rimraf('./public/music/data/'+albumRequest, function (e) {
						if(!e){
							console.log('Removed bad dir', albumRequest);
							res.redirect('/music/')
						} else {
							console.log('Removing dir error:', e)
						}
					});
				} else {
					// Read cached file and send to client.
					fs.readFile('./public/music/data/'+albumRequest+'/data.js', 'utf8', function (err, data) {
						if(!err){
							res.send(data);
						}else if(err){
							rimraf('./public/music/data/'+albumRequest, function (e) {
								if(!e){
									console.log('Removed bad dir', albumRequest);
									res.redirect('/music/')
								} else {
									console.log('Removing dir error:', e)
								}
							});
						}
					});
				}
			});
		} else {
			rimraf('./public/music/data/'+albumRequest, function (e) {
				if(!e){
					console.log('Removed bad dir', albumRequest);
					res.redirect('/music/')
				} else {
					console.log('Removing dir error:', e)
				}
			});
		}
	} else {
		console.log('New album, getting details')
		fs.mkdir('./public/music/data/'+albumRequest, 0777, function (err) {
			if (err) {
				console.log('Error creating folder',err);
			} else {
				console.log('Directory '+albumRequest+' created');

				var filename = albumRequest
				, year = filename.match(/\(.*?([0-9]{4}).*?\)/)
				, stripped = filename.replace(/\.|_|\/|\-|\[|\]|\-/g," ")
				, noyear = stripped.replace(/([0-9]{4})|\(|\)|\[|\]/g,"")
				, noCountries = noyear.replace(/320kbps|192kbps|128kbps|mp3|00/g,"")
				, albumTitle = noCountries.replace(/cd [1-9]|cd[1-9]/gi,"");
				
				helper.xhrCall("http://api.discogs.com/database/search?q="+albumTitle+"&type=release&callback=", function(response) {
					if (typeof response) {
						var requestResponse = JSON.parse(response)
						,requestInitialDetails = requestResponse.results[0];
					
						title = requestInitialDetails.title
						thumb = requestInitialDetails.thumb
						year = requestInitialDetails.year
						genre = requestInitialDetails.genre
					}
					
					//Setting up array for writing
					var scraperdata = new Array()
					,scraperdataset = null;
				
					scraperdataset = { title:title, thumb:thumb, year:year, genre:genre}
					scraperdata[scraperdata.length] = scraperdataset;
					var scraperdataJSON = JSON.stringify(scraperdata, null, 4);
					
					fs.writeFile('./public/music/data/'+albumRequest+'/data.js', scraperdataJSON, function(e) {
						if (!e) {
							fs.readFile('./public/music/data/'+albumRequest+'/data.js', 'utf8', function (err, data) {
								if(!err){
									res.send(data);
								}else{
									console.log('Cannot read scraper data', err)
								}
							});
						}else{ 
							console.log('Error getting movielist', e);
						};
					});
					
					
				});
			}
		});
	};
};