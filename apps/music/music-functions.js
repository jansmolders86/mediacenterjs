module.exports = {
	getInfo: function(req, res, infoRequest){
		var fs = require('fs.extra')
		, colors = require('colors')
		, Encoder = require('node-html-encoder').Encoder
		, encoder = new Encoder('entity')
		, helper = require('../../lib/helpers.js')
		, ini = require('ini')
		, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'))
		, dblite = require('dblite');
	
		var albumRequest = infoRequest
		, albumTitle = null
		, title = 'No data found...'
		, cover = '/music/css/img/nodata.jpg'
		, year = 'No data found...'
		, genre = 'No data found...'
		, tracks = null;
		
		// Init Database
		dblite.bin = "./lib/database/sqlite3";
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
						console.log('found info for album' .green);
						res.json(rows);
					} else {
						console.log('new album' .green);
						getData(albumRequest);
					}
				}
			);
		}
		
		function writeData(albumRequest,filename,title,cover,year,genre,tracks,callback){	
			console.log('Writing data to table for',albumRequest .green);

			var dir = config.musicpath+encoder.htmlDecode(albumRequest)+'/'
			, fileTypes = new RegExp("\.(mp3)","g");

			fs.readdir(dir,function(err,files){
				if (err){
					console.log('wrong or bad directory, please specify a existing directory',err .red);
				}else{
					var allFiles = new Array();
					files.forEach(function(file){
						var fullPath = dir + file
						stats = fs.lstatSync(fullPath);
						if (stats.isDirectory(file)) {
							var subdir = file
							, subPath = dir + file
							, files = fs.readdirSync(subPath);
						} else { 
							if (file.match(fileTypes)) allFiles.push(file); 
						}
					});
					var allFilesJSON = JSON.stringify(allFiles, null, 4);
					
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
				};
			});
		}

		//Get data if new movie
		function getData(albumRequest){
			//Check if folder exists
			if (fs.existsSync('./public/music/data/'+albumRequest)) {
				console.log('dir already created',albumRequest .green);
			}else{
				fs.mkdir('./public/music/data/'+albumRequest, 0777, function (err) {
					if (err) console.log('Error creating folder',err .red);
				});
			}

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
							discogs(albumTitle, function(title,cover,year,genre){
								writeData(albumRequest,filename,title,cover,year,genre,tracks,function(){
									getStoredData(albumRequest);
								});
							});
						}else{
						/*	files.forEach(function(file){
								if (file.match(/\.(jpg|jpeg|png|gif)/gi)){
									if (single == true){
										var title = albumRequest.replace(/\.(mp3)/gi,"")
										if (file.match(title,"g")){
											var localDir = config.musicpath+file
											copyImageFileToCache(localDir,albumRequest,file, function(){
												writeData(filename,title,cover,year,genre,tracks,function(){
													getStoredData(albumRequest);
												});
											});
										}
									} else if (file.match(/cover|front/gi)){
										var localDir = dir+file
										copyImageFileToCache(localDir,albumRequest,file, function(){
											writeData(filename,title,cover,year,genre,tracks,function(){
												getStoredData(albumRequest);
											});
										});
									} else if (file.match(/\bAlbumArt|Large/gi)){
										var localDir = dir+file
										copyImageFileToCache(localDir,albumRequest,file, function(){
											writeData(filename,title,cover,year,genre,tracks,function(){
												getStoredData(albumRequest);
											});
										});
									}
								}
							}); */
							discogs(albumTitle, function(title,cover,year,genre){
								writeData(albumRequest,filename,title,cover,year,genre,tracks,function(){
									getStoredData(albumRequest);
								});
							});
						};
					});

				}else {
					console.log('Unknown file or album, writing fallback',albumRequest .yellow)
					discogs(albumTitle, function(title,cover,year,genre){
						writeData(albumRequest,filename,title,cover,year,genre,tracks,function(){
							getStoredData(albumRequest);
						});
					});
				}
			}, 1200);	
		};

			
		function copyImageFileToCache(localDir,albumRequest,file, callback){
			console.log('local cover found',file);
			fs.copy(localDir, './public/music/data/'+albumRequest+'/'+file, function (err) {
			  if (err) {
				console.log('Error copying image to cache',err .red);
			  }
			  console.log('Copied cover to cache succesfull' .green);
			});		
			cover = '/music/data/'+albumRequest+'/'+file;	
			callback(cover);	
		}
		
		function discogs(albumTitle, callback){		
			helper.xhrCall("http://api.discogs.com/database/search?q="+albumTitle+"&type=release&callback=", function(response) {

				var requestResponse = JSON.parse(response)
				,requestInitialDetails = requestResponse.results[0];
				
				if (requestInitialDetails !== undefined && requestInitialDetails !== '' && requestInitialDetails !== null) {
					downloadCache(requestInitialDetails,function(cover) {
						
						var localImageDir = '/music/data/'+albumRequest+'/'
						, localCover = cover.match(/[^/]+$/)
						, title = requestInitialDetails.title
						, cover = localImageDir+localCover
						, year = requestInitialDetails.year
						, genre = requestInitialDetails.genre[0]
					
						callback(title,cover,year,genre);						
					});

				} else {
					console.log('Unknown file or album, writing fallback' .yellow)
					
					var title = 'No data found...'
					, cover = '/music/css/img/nodata.jpg'
					, year = 'No data found...'
					, genre = 'No data found...';
					
					callback(title,cover,year,genre);		
				}
			});	
		}
		
		function downloadCache(response,callback){	
			var downloader = require('downloader');
			
			var responseImage = response.thumb
			, downloadDir = './public/music/data/'+albumRequest+'/'
			, cover = responseImage.replace(/-90-/,"-150-");
			
			downloader.download(cover, downloadDir);
			downloader.on('error', function(msg) { console.log('error', msg); });
			callback(cover);
		}
		
		function checkDirForCorruptedFiles(albumRequest){
			var rimraf = require('rimraf');
			
			var checkDir = './public/music/data/'+albumRequest
			if(fs.existsSync('./public/music/data/'+albumRequest+'/data.js')){
				fs.stat('./public/music/data/'+albumRequest+'/data.js', function (err, stats) {		
					if(stats.size == 0){
						helper.removeBadDir(req, res, checkDir);
					} else {
						fs.readFile('./public/music/data/'+albumRequest+'/data.js', 'utf8', function (err, data) {
							if(!err){
								res.send(data);
							}else if(err){
								helper.removeBadDir(req, res, checkDir);
							}
						});
					}
				});
			} else {
				helper.removeBadDir(req, res, checkDir);
			}
		};
	},
	playTrack: function(req, res, infoRequest, optionalParam){
		var fs = require('fs.extra')
		, colors = require('colors')
		, Encoder = require('node-html-encoder').Encoder
		, encoder = new Encoder('entity')
		, ini = require('ini')
		, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'));
		
		var decodeTrack = encoder.htmlDecode(optionalParam)
		, decodeAlbum = encoder.htmlDecode(infoRequest);
		
		if (infoRequest === 'none'){
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