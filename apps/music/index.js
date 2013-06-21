
/* Modules */
var express = require('express')
, app = express()
, fs = require('fs.extra')
, downloader = require('downloader')
, rimraf = require('rimraf')
, request = require("request")
, helper = require('../../lib/helpers.js')
, Encoder = require('node-html-encoder').Encoder
, colors = require('colors');

// entity type encoder
var encoder = new Encoder('entity');

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
	, getDir = true
	, fileTypes = new RegExp("\.(mp3)","g");
	
	helper.getLocalFiles(req, res, dir, writePath, getDir, fileTypes, function(status){
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

exports.album = function(req, res, next){
	var incomingFile = req.body
	, dir = configfileResults.musicpath+encoder.htmlDecode(incomingFile.album)+'/'
	, writePath = './public/music/data/'+encoder.htmlEncode(incomingFile.album)+'/album.js'
	, getDir = false
	, fileTypes = new RegExp("\.(mp3)","g");

	helper.getLocalFiles(req, res, dir, writePath, getDir, fileTypes, function(status){
		var musicfiles = []
		, musicfiles = fs.readFileSync(writePath)
		, musicfileResults = JSON.parse(musicfiles)	
		
		res.send(musicfileResults);
	});
};

exports.track = function(req, res, next){
	var decodeTrack = encoder.htmlDecode(req.params.track).replace(/\^/gi,"/")
	if (req.params.album === 'none'){
		var track = configfileResults.musicpath+decodeTrack
	}else { 
		var track = configfileResults.musicpath+encoder.htmlDecode(req.params.album)+'/'+decodeTrack
	}
	
	console.log('Streaming track:',track)
	var stat = fs.statSync(track)
	res.writeHead(200, {
		'Content-Type':'audio/mp3',
		'Content-Length':stat.size
	});
	var stream = fs.createReadStream(track);
	stream.pipe(res);
};

exports.post = function(req, res, next){	
	var incomingFile = req.body
	, albumRequest = incomingFile.albumTitle
	, albumTitle = null
	
	var title = 'No data found...'
	, thumb = '/music/css/img/nodata.jpg'
	, year = 'No data found...'
	, genre = 'No data found...';
	
	var scraperdata = new Array()
	,scraperdataset = null;

	if (fs.existsSync('./public/music/data/'+albumRequest)) {
		checkDirForCorruptedFiles(albumRequest)
	} else {
		fs.mkdir('./public/music/data/'+albumRequest, 0777, function (err) {
			if (err) {
				console.log('Error creating folder',err .red);
			} else {
				console.log('Directory for '+albumRequest+' created' .green);

				var filename = albumRequest
				, year = filename.match(/\(.*?([0-9]{4}).*?\)/)
				, stripped = filename.replace(/\.|_|\/|\-|\[|\]|\-/g," ")
				, noyear = stripped.replace(/([0-9]{4})|\(|\)|\[|\]/g,"")
				, types = noyear.replace(/320kbps|192kbps|128kbps|mp3|320|192|128/gi,"")
				, albumTitle = types.replace(/cd [1-9]|cd[1-9]/gi,"");
				
				// mandatory timeout from discogs api
				setTimeout(function(){
					var single = false
					if (albumRequest !== undefined ){
						if (albumRequest.match(/\.(mp3)/gi)){
							var dir = configfileResults.musicpath;
							single = true 
						}else {
							var dir = configfileResults.musicpath+encoder.htmlDecode(albumRequest)+'/';
							single = false 
						}
						fs.readdir(dir,function(err,files){
							if (err){
								console.log('Error looking for album art',err .red);
								discogs(albumTitle, function(title,thumb,year,genre){
									scraperdataset = { title:title, thumb:thumb, year:year, genre:genre}						
									scraperdata[scraperdata.length] = scraperdataset;
									var dataToWrite = JSON.stringify(scraperdata, null, 4);
									var writePath = './public/music/data/'+albumRequest+'/data.js'
									helper.writeToFile(req,res,writePath,dataToWrite)
								});
							}else{
								files.forEach(function(file){
									if (file.match(/\.(jpg|jpeg|png)/gi)){
										if (single == true){
											var title = albumRequest.replace(/\.(mp3)/gi,"")
											if (file.match(title,"g")){
												fs.copy(configfileResults.musicpath+file, './public/music/data/'+albumRequest+'/'+file, function (err) {
												  if (err) {
													console.log('Error copying image to cache',err .red);
												  }
												  console.log('Copied cover to cache succesfull' .green);
												});
												
												thumb = '/music/data/'+albumRequest+'/'+file;
												
												scraperdataset = { title:title, thumb:thumb, year:year, genre:genre}						
												scraperdata[scraperdata.length] = scraperdataset;
												var dataToWrite = JSON.stringify(scraperdata, null, 4);
												var writePath = './public/music/data/'+albumRequest+'/data.js'
												helper.writeToFile(req,res,writePath,dataToWrite)
											}
										} else if (file.match(/cover|front|album|art|AlbumArtSmall/gi)){
											console.log('local cover found',file);

											fs.copy(dir+file, './public/music/data/'+albumRequest+'/'+file, function (err) {
											  if (err) {
												console.log('Error copying image to cache',err .red);
											  }
											  console.log('Copied cover to cache succesfull' .green);
											});
			
											
											thumb = '/music/data/'+albumRequest+'/'+file;
											
											scraperdataset = { title:title, thumb:thumb, year:year, genre:genre}						
											scraperdata[scraperdata.length] = scraperdataset;
											var dataToWrite = JSON.stringify(scraperdata, null, 4);
											var writePath = './public/music/data/'+albumRequest+'/data.js'
											helper.writeToFile(req,res,writePath,dataToWrite)
										} 
									} 
								});

							};
						});

					}else {
						console.log('Unknown file or album, writing fallback',albumRequest .blue)
						scraperdataset = { title:title, thumb:thumb, year:year, genre:genre}						
						scraperdata[scraperdata.length] = scraperdataset;
						var dataToWrite = JSON.stringify(scraperdata, null, 4);
						var writePath = './public/music/data/'+albumRequest+'/data.js'
						helper.writeToFile(req,res,writePath,dataToWrite)
					}
				}, 1200);	
			};
		});
		
		
		function discogs(albumTitle, callback){		
			helper.xhrCall("http://api.discogs.com/database/search?q="+albumTitle+"&type=release&callback=", function(response) {

				var requestResponse = JSON.parse(response)
				,requestInitialDetails = requestResponse.results[0];
				
				if (requestInitialDetails !== undefined && requestInitialDetails !== '' && requestInitialDetails !== null) {
					downloadCache(requestInitialDetails,function(cover) {
						
						var localImageDir = '/music/data/'+albumRequest+'/'
						, localCover = cover.match(/[^/]+$/)
						, title = requestInitialDetails.title
						, thumb = localImageDir+localCover
						, year = requestInitialDetails.year
						, genre = requestInitialDetails.genre		
					
						callback(title,thumb,year,genre);						
					});

				} else {
					console.log('nothing found')
					
					var title = 'No data found...'
					, thumb = '/music/css/img/nodata.jpg'
					, year = 'No data found...'
					, genre = 'No data found...';
					
					callback(title,thumb,year,genre);		
				}
			});	
			
		}
		
		
		function downloadCache(response,callback){	
			var cover = response.thumb
			, downloadDir = './public/music/data/'+albumRequest+'/';
			
			downloader.on('done', function(msg) { console.log('done', msg); });
			downloader.on('error', function(msg) { console.log('error', msg); });
			downloader.download(cover, downloadDir);
			callback(cover);
		};
	
		function checkDirForCorruptedFiles(albumRequest){
			var checkDir = './public/music/data/'+albumRequest

			if(fs.existsSync('./public/music/data/'+albumRequest+'/data.js')){
				fs.stat('./public/music/data/'+albumRequest+'/data.js', function (err, stats) {		
					if(stats.size == 0){
						helper.removeBadDir(req, res, checkDir)
					} else {
						fs.readFile('./public/music/data/'+albumRequest+'/data.js', 'utf8', function (err, data) {
							if(!err){
								res.send(data);
							}else if(err){
								helper.removeBadDir(req, res, checkDir)
							}
						});
					}
				});
			} else {
				helper.removeBadDir(req, res, checkDir)
			}
		}
		
	};
};
