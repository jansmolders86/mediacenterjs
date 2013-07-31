
/* Modules */
var express = require('express')
, app = express()
, fs = require('fs.extra')
, downloader = require('downloader')
, rimraf = require('rimraf')
, request = require("request")
, lame = require('lame')
, helper = require('../../lib/helpers.js')
, Encoder = require('node-html-encoder').Encoder
, colors = require('colors')
, ini = require('ini')
, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'));

// entity type encoder
var encoder = new Encoder('entity');

exports.engine = 'jade';
 
// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
exports.engine = 'jade';

// Render the indexpage
exports.index = function(req, res, next){	
	var dir = config.musicpath
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
			selectedTheme: config.theme,
			status:status
		});
	});
};

exports.album = function(req, res, next){
	var incomingFile = req.body
	, dir = config.musicpath+encoder.htmlDecode(incomingFile.album)+'/'
	, writePath = './public/music/data/'+encoder.htmlEncode(incomingFile.album)+'/album.js'
	, getDir = false
	, fileTypes = new RegExp("\.(mp3)","g");

	if (fs.existsSync(writePath)) {
		var musicfiles = []
		, musicfiles = fs.readFileSync(writePath)
		, musicfileResults = JSON.parse(musicfiles);
		
		fs.stat(writePath, function (err, stats) {		
			if(stats.size == 0){
				rimraf(writePath, function (e) {
					if(e){
						console.log('Removing dir error:', e .red)
					} else{
						helper.getLocalFiles(req, res, dir, writePath, getDir, fileTypes, function(err,status){
							if(err){
								console.log('error writing files to disk', err)
							}else {
								musicfiles = fs.readFileSync(writePath)
								musicfileResults = JSON.parse(musicfiles);
								
								res.send(musicfileResults);
							}
						});					
					}
				});
			} else {
				res.send(musicfileResults);
			}
		});
	} else {
		helper.getLocalFiles(req, res, dir, writePath, getDir, fileTypes, function(err,status){
			if(err){
				console.log('error writing files to disk', err)
			}else {
				var musicfiles = []
				, musicfiles = fs.readFileSync(writePath)
				, musicfileResults = JSON.parse(musicfiles);
				
				res.send(musicfileResults);
			}
		});
	}
	
};

exports.track = function(req, res, next){
	var decodeTrack = encoder.htmlDecode(req.params.track)
	, decodeAlbum = encoder.htmlDecode(req.params.album)
	if (req.params.album === 'none'){
		var track = config.musicpath+decodeTrack
	}else {
		var track = config.musicpath+decodeAlbum+'/'+decodeTrack
	}

	var stat = fs.statSync(track)
	, start = 0
	, end = 0
	, range = req.header('Range');

	if (range != null) {
	start = parseInt(range.slice(range.indexOf('bytes=')+6,
		range.indexOf('-')));
	end = parseInt(range.slice(range.indexOf('-')+1,
		range.length));
	}
	if (isNaN(end) || end === 0) end = stat.size-1;
	if (start > end) return;


	res.writeHead(206, { // NOTE: a partial http response
		'Connection':'close',
		'Content-Type':'audio/mp3',
		'Content-Length':end - start,
		'Content-Range':'bytes '+start+'-'+end+'/'+stat.size,
		'Transfer-Encoding':'chunked'
	});

	var stream = fs.createReadStream(track)
	//.pipe(new lame.Decoder);
	stream.pipe(res);
	
};


exports.post = function(req, res, next){	
	var incomingFile = req.body
	, albumRequest = incomingFile.albumTitle
	, albumTitle = null
	, title = 'No data found...'
	, thumb = '/music/css/img/nodata.jpg'
	, year = 'No data found...'
	, genre = 'No data found...';

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
							var dir = config.musicpath;
							single = true 
						}else {
							var dir = config.musicpath+encoder.htmlDecode(albumRequest)+'/';
							single = false 
						}
						fs.readdir(dir,function(err,files){
							if (err){
								console.log('Error looking for album art',err .red);
								discogs(albumTitle, function(title,thumb,year,genre){
									writeData(title,thumb,year,genre);
								});
							}else{
								files.forEach(function(file){
									if (file.match(/\.(jpg|jpeg|png|gif)/gi)){
										if (single == true){
											var title = albumRequest.replace(/\.(mp3)/gi,"")
											if (file.match(title,"g")){
												var localDir = config.musicpath+file
												copyImageFileToCache(localDir,albumRequest,file, function(){
													writeData(title,thumb,year,genre);
												});
											}
										} else if (file.match(/cover|front/gi)){
											var localDir = dir+file
											copyImageFileToCache(localDir,albumRequest,file, function(){
												writeData(title,thumb,year,genre);
											});
										} else if (file.match(/\bAlbumArt|Large/gi)){
											var localDir = dir+file
											copyImageFileToCache(localDir,albumRequest,file, function(){
												writeData(title,thumb,year,genre);
											});
										} 
									}
								});
								discogs(albumTitle, function(title,thumb,year,genre){
									writeData(title,thumb,year,genre);
								});
							};
						});

					}else {
						console.log('Unknown file or album, writing fallback',albumRequest .yellow)
						discogs(albumTitle, function(title,thumb,year,genre){
							writeData(title,thumb,year,genre);
						});
					}
				}, 1200);	
			};
		});
		
		function copyImageFileToCache(localDir,albumRequest,file, callback){
			console.log('local cover found',file);
			fs.copy(localDir, './public/music/data/'+albumRequest+'/'+file, function (err) {
			  if (err) {
				console.log('Error copying image to cache',err .red);
			  }
			  console.log('Copied cover to cache succesfull' .green);
			});		
			thumb = '/music/data/'+albumRequest+'/'+file;	
			callback(thumb);	
		};
		
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
					console.log('Unknown file or album, writing fallback' .yellow)
					
					var title = 'No data found...'
					, thumb = '/music/css/img/nodata.jpg'
					, year = 'No data found...'
					, genre = 'No data found...';
					
					callback(title,thumb,year,genre);		
				}
			});	
		};
		
		function writeData(title,thumb,year,genre){		
			var scraperdata = new Array()
			,scraperdataset = null;
			
			scraperdataset = { title:title, thumb:thumb, year:year, genre:genre}						
			scraperdata[scraperdata.length] = scraperdataset;
			var dataToWrite = JSON.stringify(scraperdata, null, 4);
			var writePath = './public/music/data/'+albumRequest+'/data.js';
			
			helper.writeToFile(req,res,writePath,dataToWrite);
		};
		
		
		function downloadCache(response,callback){	
			var responseImage = response.thumb
			, downloadDir = './public/music/data/'+albumRequest+'/'
			, cover = responseImage.replace(/-90-/,"-150-");
			
			downloader.download(cover, downloadDir);
			downloader.on('error', function(msg) { console.log('error', msg); });
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
		};
		
	};
};
