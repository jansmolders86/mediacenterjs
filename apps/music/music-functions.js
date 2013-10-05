// TODO: This file needs heavy optimization!!

var file_utils = require('../../lib/utils/file-utils'),
	ajax_utils = require('../../lib/utils/ajax-utils'),
	app_cache_handler = require('../../lib/handlers/app-cache-handler'),
	config = require('../../lib/handlers/configuration-handler').getConfiguration();

module.exports = {
	loadItems: function(req,res){
		var fs = require('fs')
		, dir = config.musicpath
		, suffix = new RegExp("\.(mp3)","g");

		file_utils.getLocalFiles(dir, suffix, function(err,files){
			var unique = {}, 
			albums = [];
			for(var i = 0, l = files.length; i < l; ++i){
				var albumDir = files[i].dir;
				var albumTitles = albumDir.substring(albumDir.lastIndexOf("/")).replace(/^\/|\/$/g, '');
				
				// filter albums on unique title
				if(unique.hasOwnProperty(albumTitles)) {
					continue;
				}
				
				//single
				if(albumTitles === '' && files[i].file !== undefined){
					albumTitles = files[i].file;
				}
				
				albums.push(albumTitles);
				unique[albumTitles] = 1;
			}

			res.json(albums);
		});
	},
	getInfo: function(req, res, infoRequest){
		var fs = require('fs.extra')
		, colors = require('colors')
		, Encoder = require('node-html-encoder').Encoder
		, encoder = new Encoder('entity')
		, dblite = require('dblite');
	
		var albumRequest = infoRequest
		, albumTitle = null
		, title = 'No data found...'
		, cover = '/music/css/img/nodata.jpg'
		, year = 'No data found...'
		, genre = 'No data found...'
		, single = false
		, tracks = null;
		
		// Init Database
		var db = dblite('./lib/database/mcjs.sqlite');
		db.query("CREATE TABLE IF NOT EXISTS music (filename TEXT PRIMARY KEY,title VARCHAR, cover VARCHAR, year VARCHAR, genre VARCHAR , tracks VARCHAR)");

		db.on('info', function (text) { console.log(text) });
		db.on('error', function (err) { console.error('Database error: ' + err) });
		
		console.log('Searching for '+albumRequest+' in database');
		getStoredData(albumRequest);
		
		function getStoredData(albumRequest){
			db.query(
				'SELECT * FROM music WHERE filename =? ', [albumRequest],{
					filename	: String,
					title		: String,
					cover		: String,
					year		: String,
					genre		: String,
					tracks		: JSON.parse
				},
				function(rows) {
					if (typeof rows !== 'undefined' && rows.length > 0){
						return res.json(rows);
					} else {
						return getData(albumRequest);
					}
				}
			);
		}
		
		function writeData(albumRequest,filename,title,cover,year,genre,tracks,callback){
		
			if(single === true){
				var allFilesJSON = JSON.stringify(albumRequest, null, 4);
				db.query(
					'INSERT OR REPLACE INTO music VALUES(?,?,?,?,?,?)', [
						filename,
						title,
						cover,
						year,
						genre,
						allFilesJSON
					]
				);
				callback();
			}else{

				var dir = config.musicpath+encoder.htmlDecode(albumRequest)+'/'
				, suffix = new RegExp("\.(mp3)","g");

				file_utils.getLocalFiles(dir, suffix, function(err,files){
						var tracks = [];
						for(var i = 0, l = files.length; i < l; ++i){
							var track = files[i].file;
							tracks.push(track);
						}

						var allFilesJSON = JSON.stringify(tracks, null, 4);
						db.query(
							'INSERT OR REPLACE INTO music VALUES(?,?,?,?,?,?)', [
								filename,
								title,
								cover,
								year,
								genre,
								allFilesJSON
							]
						);
						callback();
				});
			}
		}

		//Get data if new album
		function getData(albumRequest){

			var filename = albumRequest
			, year = filename.match(/\(.*?([0-9]{4}).*?\)/)
			, stripped = filename.replace(/\.|_|\/|\-|\[|\]|\-/g," ")
			, noyear = stripped.replace(/([0-9]{4})|\(|\)|\[|\]/g,"")
			, types = noyear.replace(/320kbps|192kbps|128kbps|mp3|320|192|128/gi,"")
			, albumTitle = types.replace(/cd [1-9]|cd[1-9]/gi,"")
			, localDir = null
			, localFile = null
			, foundLocal = false;

			// mandatory timeout from discogs api
			setTimeout(function(){
				if (albumRequest !== undefined ){
					var dir;
					if (albumRequest.match(/\.(mp3)/gi)){
						dir = config.musicpath;
						single = true 
					}else {
						dir = config.musicpath+encoder.htmlDecode(albumRequest)+'/';
						single = false 
					}

					var suffix = new RegExp("\.(mp3|jpg|jpeg|png|gif)","g");
					file_utils.getLocalFiles(dir, suffix, function(err,files){
						files.forEach(function(file){
							if (file.file.match(/\.(jpg|jpeg|png|gif)/gi)){
								if (single == true){
									var title = albumRequest.replace(/\.(mp3)/gi,"")
									if (file.file.match(title,"g")){
										var localDir = config.musicpath+file;
										discogs(albumRequest,albumTitle, foundLocal, localDir, localFile, function(title,cover,year,genre){
											writeData(albumRequest,filename,title,cover,year,genre,tracks,function(){
												getStoredData(albumRequest);
											});
										});	
									}
								} else if (file.file.match(/cover|front/gi)){
									localDir = file.dir+file;
									localFile = file; 
									foundLocal = true;
									
									discogs(albumRequest,albumTitle, foundLocal, localDir, localFile, function(title,cover,year,genre){
										writeData(albumRequest,filename,title,cover,year,genre,tracks,function(){
											getStoredData(albumRequest);
										});
									});	
								}
							}
						});
						discogs(albumRequest,albumTitle, foundLocal, localDir, localFile, function(title,cover,year,genre){
							writeData(albumRequest,filename,title,cover,year,genre,tracks,function(){
								getStoredData(albumRequest);
							});
						});	
					});
				} else {
					console.log('Unknown file or album, writing fallback',albumRequest .yellow);
					discogs(albumRequest,albumTitle, foundLocal, localDir, localFile, function(title,cover,year,genre){
						writeData(albumRequest,filename,title,cover,year,genre,tracks,function(){
							getStoredData(albumRequest);
						});
					});	
				}
			}, 1200);	
		};
		
		function discogs(albumRequest, albumTitle, foundLocal, localDir, localFile, callback){
			var mm = require('musicmetadata');
			var dir = config.musicpath+albumRequest+'/';
			var suffix = new RegExp("\.(mp3)","g");
			file_utils.getLocalFiles(dir, suffix, function(err,files){
				var parser = new mm(fs.createReadStream(files[0].href));

				console.log('Looking for ID3 tag info');	
				//listen for the metadata event
				parser.on('metadata', function (result) {
					var albumArtist = result.artist;
					var albumName = result.album;
					
					if(albumArtist && albumName){
						var albumString = albumArtist.toString() + ' - ' + albumName.toString();
						console.log('Found ID3 tag info:', albumString);
					}else{
						console.log('No ID3 tag info, falling back:', albumTitle);
					}

					ajax_utils.xhrCall("http://api.discogs.com/database/search?q="+albumString+"&type=release&callback=", function(response) {

						var requestResponse = JSON.parse(response),
							requestInitialDetails = requestResponse.results[0];
						
						if (requestInitialDetails) {
						
							title = requestInitialDetails.title;
							cover = '/music/css/img/nodata.jpg';
							year = requestInitialDetails.year;
							genre = requestInitialDetails.genre[0];
						
							if (foundLocal || (localDir && localFile)){
								fs.copy(localDir, app_cache_handler.getCachePath('music', albumRequest, localFile), function (err) {
									if (err) console.log('Error copying image to cache',err .red);
									console.log('Copied cover to cache succesfull' .green);
								});

								cover = app_cache_handler.getFrontendCachePath('music', albumRequest, localFile);
								callback(title,cover,year,genre);		
							} else {
								downloadCache(requestInitialDetails, albumRequest, function(cover) {
									var localCover = cover.match(/[^/]+$/);
									cover = app_cache_handler.getFrontendCachePath('music', albumRequest, localCover[0]);
									callback(title, cover, year, genre);
								});
							}

						} else {
							console.log('Unknown file or album, writing fallback' .yellow)
							
							title = 'No data found...';
							cover = '/music/css/img/nodata.jpg';
							year = 'No data found...';
							genre = 'No data found...';
							
							callback(title,cover,year,genre);		
						}
					});	
				  
				});
			});
		}
		
		function downloadCache(response, albumRequest, callback){
			// Create dir to store images if needed.
			app_cache_handler.ensureCacheDirExists('music', albumRequest);
			var downloader = require('downloader');
			
			var responseImage = response.thumb
			, downloadDir = app_cache_handler.getCacheDir('music', albumRequest) + '/'
			, cover = responseImage.replace(/-90-/,"-150-");

			downloader.download(cover, downloadDir);
			downloader.on('error', function(msg) { console.log('error', msg); });
			callback(cover);
		}
	},
	playTrack: function(req, res, infoRequest, optionalParam){
		var fs = require('fs.extra')
		, colors = require('colors')
		, Encoder = require('node-html-encoder').Encoder
		, encoder = new Encoder('entity');
		
		var decodeTrack = encoder.htmlDecode(optionalParam)
		, decodeAlbum = encoder.htmlDecode(infoRequest);
		
		if (infoRequest === 'none'){
			var track = config.musicpath+decodeTrack;
			startplayback(track);
		} else if (decodeAlbum !== undefined){
			var dir = config.musicpath+decodeAlbum+'/';
			var suffix = new RegExp("\.(mp3)","g");
			file_utils.getLocalFiles(dir, suffix, function(err,files){
				files.forEach(function(file){
					if(file.file === decodeTrack){
						var track = file.href;
						startplayback(track);
					}
				});
			});
		}
		
		
		function startplayback(track){
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

			console.log('Playing track', track .green)

			res.writeHead(206, { // NOTE: a partial http response
				'Connection':'close',
				'Content-Type':'audio/mp3',
				'Content-Length':end - start,
				'Content-Range':'bytes '+start+'-'+end+'/'+stat.size,
				'Transfer-Encoding':'chunked'
			});

			var stream = fs.createReadStream(track);
			stream.pipe(res);
		}
	}
}