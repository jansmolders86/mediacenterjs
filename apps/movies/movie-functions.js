/* Global Imports */
var fs = require('fs.extra')
	, file_utils = require('../../lib/utils/file-utils')
	, ajax_utils = require('../../lib/utils/ajax-utils')
	, app_cache_handler = require('../../lib/handlers/app-cache-handler')
	, colors = require('colors')
	, dblite = require('dblite')
	, config = require('../../lib/handlers/configuration-handler').getConfiguration();

/* Constants */
var SUPPORTED_FILETYPES = new RegExp("\.(avi|mkv|mpeg|mov|mp4)","g");

exports.initMovieDb = function() {
	// Init Database
	var db = dblite('./lib/database/mcjs.sqlite');
	db.query("CREATE TABLE IF NOT EXISTS movies (local_name TEXT PRIMARY KEY,original_name VARCHAR, poster_path VARCHAR, backdrop_path VARCHAR, imdb_id INTEGER, rating VARCHAR, certification VARCHAR, genre VARCHAR, runtime VARCHAR, overview TEXT, cd_number VARCHAR)");

	return db;
};

exports.loadItems = function (req, res){
	file_utils.getLocalFiles(config.moviepath, SUPPORTED_FILETYPES, function(err, files) {
		var movies = [];
		for(var i = 0, l = files.length; i < l; ++i){
			var movieFiles = files[i].file;
			var movieTitles = movieFiles.substring(movieFiles.lastIndexOf("/")).replace(/^\/|\/$/g, '');

			//single
			if(movieTitles === '' && files[i].file !== undefined){
				movieTitles = files[i].file;
			}

			movies.push(movieTitles);
		}

		res.json(movies);
	});
};

exports.playMovie = function (req, res, platform, movieRequest){
	var movie_playback_handler = require('./movie-playback-handler');

	file_utils.getLocalFile(config.moviepath, movieRequest, function(err, file) {
		if (err) console.log(err .red);
		if (file) {
			var movieUrl = file.href;
			var stat = fs.statSync(movieUrl);

			console.log('Client platform is', platform);
			movie_playback_handler.startPlayback(res, movieUrl, stat, platform);
		} else {
			console.log("File " + movieRequest + " could not be found!" .red);
		}
	});
};

exports.handler = function (req, res, infoRequest){
	// TODO: Rework this heavy method...

	//Modules
	var downloader = require('downloader');

	// Variable defaults
	var movieRequest = infoRequest
		, movieTitle = 'No data found...'
		, api_key = '7983694ec277523c31ff1212e35e5fa3'
		, cd_number = 'No data found...'
		, original_name = 'No data found...'
		, poster_path = '/movies/css/img/nodata.jpg'
		, backdrop_path = '/movies/css/img/backdrop.png'
		, imdb_id = 'No data found...'
		, rating = 'No data found...'
		, certification = 'No data found...'
		, genre = null
		, runtime = 'No data found...'
		, overview = 'No data found...'
		, db = this.initMovieDb();

	db.on('info', function (text) { console.log(text) });
	db.on('error', function (err) { console.error('Database error: ' + err) });

	console.log('Searching for '+movieRequest+' in database');
	getStoredData(movieRequest);


	//Get data if new movie
	function getData(movieRequest){
		//Check if folder exists
		app_cache_handler.ensureCacheDirExists('movies', movieRequest);

		// TODO: Try to move some of those texts to outside
		var filename = movieRequest
			, year = filename.match(/19\d{2}|20\d{2/)
			, stripped = filename.replace(/\.|_|\/|\+|\-/g," ")
			, noyear = stripped.replace(/([0-9]{4})|\(|\)|\[|\]/g,"")
			, releasegroups = noyear.replace(/FxM|aAF|arc|AAC|MLR|AFO|TBFA|WB|ARAXIAL|UNiVERSAL|ToZoon|PFa|SiRiUS|Rets|BestDivX|NeDiVx|ESPiSE|iMMORTALS|QiM|QuidaM|COCAiN|DOMiNO|JBW|LRC|WPi|NTi|SiNK|HLS|HNR|iKA|LPD|DMT|DvF|IMBT|LMG|DiAMOND|DoNE|D0PE|NEPTUNE|TC|SAPHiRE|PUKKA|FiCO|PAL|aXXo|VoMiT|ViTE|ALLiANCE|mVs|XanaX|FLAiTE|PREVAiL|CAMERA|VH-PROD|BrG|replica|FZERO/g, "")
			, movietype = releasegroups.replace(/dvdrip|multi9|xxx|web|hdtv|vhs|embeded|embedded|ac3|dd5 1|m sub|x264|dvd5|dvd9|multi sub|non sub|subs|ntsc|ingebakken|torrent|torrentz|bluray|brrip|sample|xvid|cam|camrip|wp|workprint|telecine|ppv|ppvrip|scr|screener|dvdscr|bdscr|ddc|R5|telesync|telesync|pdvd|1080p|hq|sd|720p|hdrip/gi, "")
			, noCountries = movietype.replace(/NL|SWE|SWESUB|ENG|JAP|BRAZIL|TURKIC|slavic|SLK|ITA|HEBREW|HEB|ESP|RUS|DE|german|french|FR|ESPA|dansk|HUN/g,"")
			, movieTitle = noCountries.replace(/cd [1-9]|cd[1-9]/gi,"").trimRight();

		hasCdinTitle = filename.match(/cd [1-9]|cd[1-9]/gi);

		if(hasCdinTitle !== undefined && hasCdinTitle !== null) cd_number = hasCdinTitle.toString();

		if(year !== undefined && year !== null){
			year.toString();
		} else {
			year = '';
		}

		ajax_utils.xhrCall("http://api.themoviedb.org/3/search/movie?api_key="+api_key+"&query="+movieTitle+"&language="+config.language+"&year="+year+"&=", function(response) {
			var requestResponse = JSON.parse(response)
				, requestInitialDetails = requestResponse.results[0];

			downloadCache(requestInitialDetails,movieRequest,function(poster, backdrop) {
				if (requestInitialDetails !== undefined && requestInitialDetails !== '' && requestInitialDetails !== null) {
					poster_path = app_cache_handler.getFrontendCachePath('movies', movieTitle, requestInitialDetails.poster_path);
					backdrop_path = app_cache_handler.getFrontendCachePath('movies', movieTitle, requestInitialDetails.backdrop_path);
					var id = requestInitialDetails.id;
					original_name = requestInitialDetails.original_title;

					ajax_utils.xhrCall("http://api.themoviedb.org/3/movie/"+id+"?api_key="+api_key+"&=", function(response) {
						if (response !== 'Nothing found.' && response !== undefined && response !== '' && response !== null) {
							var secondRequestResponse = JSON.parse(response);
							var genresFound = secondRequestResponse.genres;

							if(genresFound.length){
								genre = secondRequestResponse.genres[0].name;
							}

							runtime = secondRequestResponse.runtime;
							imdb_id = secondRequestResponse.imdb_id;
							overview = secondRequestResponse.overview;
							// Needs seperate call
							// rating = secondRequestResponse.rating;
							// certification = requestInitialDetails.certification;
						}

						writeData(original_name,poster_path,backdrop_path,imdb_id,rating,certification,genre,runtime,overview, function(){
							getStoredData(movieRequest);
						});

					});
				} else {
					writeData(original_name,poster_path,backdrop_path,imdb_id,rating,certification,genre,runtime,overview, function(){
						getStoredData(movieRequest);
					});
				}
			});
		});

	}


	function getStoredData(movieRequest){
		db.query(
			'SELECT * FROM movies WHERE local_name =? ', [movieRequest],{
				local_name 		: String,
				original_name  	: String,
				poster_path  	: String,
				backdrop_path  	: String,
				imdb_id  		: String,
				rating  		: String,
				certification  	: String,
				genre  			: String,
				runtime  		: String,
				overview  		: String,
				cd_number  		: String
			},
			function(rows) {
				if (typeof rows !== 'undefined' && rows.length > 0){
					console.log('found info for movie' .green);
					res.json(rows);
				} else {
					console.log('new movie' .green);
					getData(movieRequest);
				}
			}
		);
	}

	function downloadCache(response,movieRequest,callback){
		if (response !== undefined && response !== '' && response !== null) {
			var backdrop_url = "http://cf2.imgobject.com/t/p/w1920/"
				, poster_url = "http://cf2.imgobject.com/t/p/w342/"
				, poster = poster_url + response.poster_path
				, backdrop = backdrop_url + response.backdrop_path
				, downloadDir = app_cache_handler.getCacheDir('movies', movieRequest) + '/';

			if (fs.existsSync(downloadDir + response.poster_path) === true &&
				fs.existsSync(downloadDir + response.backdrop_path) === true) {
				return callback(poster,backdrop);
			} else {
				downloader.on('done', function(msg) { console.log('done', msg); });
				downloader.on('error', function(msg) { console.log('error', msg); });
				downloader.download(poster, downloadDir);
				downloader.download(backdrop, downloadDir);

				return callback(poster,backdrop);
			}
		} else {
			// TODO...
			return callback(null, null);
		}
	}

	function writeData(original_name,poster_path,backdrop_path,imdb_id,rating,certification,genre,runtime,overview,callback){
		console.log('Writing data to table for',movieRequest .green);
		db.query(
			'INSERT OR REPLACE INTO movies VALUES(?,?,?,?,?,?,?,?,?,?,?)', [
				movieRequest,
				original_name,
				poster_path,
				backdrop_path,
				imdb_id,
				rating,
				certification,
				genre,
				runtime,
				overview,
				cd_number
			]
		);
		callback();
	}
};

exports.getGenres = function (req, res){
	var db = this.initMovieDb();

	db.on('info', function (text) { console.log(text) });
	db.on('error', function (err) { console.error('Database error: ' + err) });

	db.query(
		'SELECT genre FROM movies',
		function(rows) {
			if (typeof rows !== 'undefined' && rows.length > 0){
				var allGenres = rows[0][0].replace(/\r\n|\r|\n| /g,",")
					, genreArray = allGenres.split(',');
				res.json(genreArray);
			}
		}
	);
};

exports.filter = function (req, res, infoRequest){
	var db = this.initMovieDb();

	db.on('info', function (text) { console.log(text) });
	db.on('error', function (err) { console.error('Database error: ' + err) });

	db.query(
		'SELECT * FROM movies WHERE genre =?',[infoRequest],{
			local_name 	: String
		},
		function(rows) {
			if (typeof rows !== 'undefined' && rows.length > 0) res.json(rows);
		}
	);
};
