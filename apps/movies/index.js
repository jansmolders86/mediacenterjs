/*
	MediaCenterJS - A NodeJS based mediacenter solution
	
    Copyright (C) 2013 - Jan Smolders

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/* Modules */
var express = require('express')
, app = express()
, fs = require('fs')
, downloader = require('downloader')
, request = require("request")
, ffmpeg = require('fluent-ffmpeg')
, rimraf = require('rimraf');

exports.engine = 'jade';

var movielistpath = './public/movies/data/movieindex.js'
var configfile = []
,configfilepath = './configuration/setup.js'
,configfile = fs.readFileSync(configfilepath)
,configfileResults = JSON.parse(configfile);	

exports.index = function(req, res, next){	
	updateMovies(req, res, function(status){
		var moviefiles = []
		,moviefilepath = './public/movies/data/movieindex.js'
		,moviefiles = fs.readFileSync(moviefilepath)
		,moviefileResults = JSON.parse(moviefiles)	
		
		res.render('movies',{
			movies: moviefileResults,
			status:status
		});
	});
};

exports.play = function(req, res){

	var movieData = []
	, moviedatapath = './public/movies/data/'+req.params.filename+'/data.js'
	, movieData = fs.readFileSync(moviedatapath)
	, movieDataResults = JSON.parse(movieData)
	, stream = configfileResults.moviepath +'/'+movieDataResults.path;
	
	/*
	var fullPath = stream.replace(/[^/]*$/, "");
	
	TODO: make subtitles work
	fs.readdir(fullPath,function(err,files){
		if (err){
			console.log(status);
		}else{
			var allMovies = new Array();
			files.forEach(function(file){
				if (file.match(/\.(srt)/)){
					res.send(file)
				}
			});
		}
	});
	*/

	var  proc = new ffmpeg({ source: configfileResults.moviepath + req.params.filename, nolog: true, priority: 1, timeout:15000})
		.toFormat('webm')
		.withVideoBitrate('1024k')
		.bufferSize('183k')
		//.chunkSize('14336')
		// Option srt handler? .addInput('soundtrack.mp3')
		.writeToStream(res, function(retcode, error){
		if (!error){
			console.log('file has been converted succesfully',retcode);
		}else{
			console.log('file conversion error',error);
		}
	});
}

exports.post = function(req, res, next){	
	var movieTitle = null
	, api_key = '7983694ec277523c31ff1212e35e5fa3'
	, cdNumber = null
	, id = 'No data found...'
	, poster_path = '/movies/css/img/nodata.jpg'
	, backdrop_path = '/movies/css/img/overlay.png'
	, original_name = 'No data found...'
	, imdb_id = 'No data found...'
	, rating = 'No data found...'
	, certification = 'No data found...'
	, genre = 'No data found...'
	, runtime = 'No data found...'
	, overview = 'No data found...';

	var incommingFile = req.body
	, incommingMovieTitle = incommingFile.movieTitle
	, movieRequest = '';
	
	if (incommingMovieTitle.match(/\//)) { 
		var strippingFile = incommingMovieTitle.split('/');
		movieRequest = strippingFile[1];
	}else{ 
		movieRequest = incommingMovieTitle;
	}
	
	console.log('Getting data for movie', movieRequest);
	//Check if folder already exists
	if (fs.existsSync('./public/movies/data/'+movieRequest)) {
		if(fs.existsSync('./public/movies/data/'+movieRequest+'/data.js')){
			fs.stat('./public/movies/data/'+movieRequest+'/data.js', function (err, stats) {
				// If data file is created without data, we remove it (rm -rf using module RimRaf).
				if(stats.size == 0){
					rimraf('./public/movies/data/'+movieRequest, function (e) {
						if(!e){
							console.log('Removed bad dir', movieRequest);
							res.redirect('/movies/')
						} else {
							console.log('Removing dir error:', e)
						}
					});
				} else {
					// Read cached file and send to client.
					fs.readFile('./public/movies/data/'+movieRequest+'/data.js', 'utf8', function (err, data) {
						if(!err){
							res.send(data);
						}else if(err){
							rimraf('./public/movies/data/'+movieRequest, function (e) {
								if(!e){
									console.log('Removed bad dir', movieRequest);
									res.redirect('/movies/')
								} else {
									console.log('Removing dir error:', e)
								}
							});
						}
					});
				}
			});
		} else {
			rimraf('./public/movies/data/'+movieRequest, function (e) {
				if(!e){
					console.log('Removed bad dir', movieRequest);
					res.redirect('/movies/')
				} else {
					console.log('Removing dir error:', e)
				}
			});
		}
	} else {
		console.log('New movie, getting details')
		fs.mkdir('./public/movies/data/'+movieRequest, 0777, function (err) {
			if (err) {
				console.log('Error creating folder',err);
			} else {
				console.log('Directory '+movieRequest+' created');

				// Building scraper url
				var filename = movieRequest
				, year = filename.match(/\(.*?([0-9]{4}).*?\)/)
				, stripped = filename.replace(/\.|_|\/|\+|\-/g," ")
				, noyear = stripped.replace(/([0-9]{4})|\(|\)|\[|\]/g,"")
				, releasegroups = noyear.replace(/FxM|aAF|arc|AAC|MLR|AFO|TBFA|WB|ARAXIAL|UNiVERSAL|ToZoon|PFa|SiRiUS|Rets|BestDivX|NeDiVx|ESPiSE|iMMORTALS|QiM|QuidaM|COCAiN|DOMiNO|JBW|LRC|WPi|NTi|SiNK|HLS|HNR|iKA|LPD|DMT|DvF|IMBT|LMG|DiAMOND|DoNE|D0PE|NEPTUNE|TC|SAPHiRE|PUKKA|FiCO|PAL|aXXo|VoMiT|ViTE|ALLiANCE|mVs|XanaX|FLAiTE|PREVAiL|CAMERA|VH-PROD|BrG|replica|FZERO/g, "")
				, movietype = releasegroups.replace(/dvdrip|multi9|xxx|web|hdtv|vhs|embeded|embedded|ac3|dd5 1|m sub|x264|dvd5|dvd9|multi sub|non sub|subs|ntsc|ingebakken|torrent|torrentz|bluray|brrip|sample|xvid|cam|camrip|wp|workprint|telecine|ppv|ppvrip|scr|screener|dvdscr|bdscr|ddc|R5|telesync|telesync|pdvd|1080p|hq|sd|720p|hdrip/gi, "")
				, noCountries = movietype.replace(/NL|SWE|SWESUB|ENG|JAP|BRAZIL|TURKIC|slavic|SLK|ITA|HEBREW|HEB|ESP|RUS|DE|german|french|FR|ESPA|dansk|HUN/g,"")
				, noCD = noCountries.replace(/cd [1-9]|cd[1-9]/gi,"");
				
				cdNumber = filename.match(/cd [1-9]|cd[1-9]/gi,"");
				movieTitle = noCD.replace(/avi|mkv|mpeg|mpg|mov|mp4|wmv|txt/gi,"").trimRight();
				if (year == null) year = ''
				
				xhrCall("http://api.themoviedb.org/3/search/movie?api_key="+api_key+"&query="+movieTitle+"&year="+ year +"&language="+configfileResults.language+"&=", function(response) {
					if (response != 'Nothing found.') {
					
						var requestResponse = JSON.parse(response)
						,requestInitialDetails = requestResponse.results[0]

						 downloadCache(requestInitialDetails,function(poster, backdrop) {

							// Additional error check
							if(typeof response){
								var localImageDir = '/movies/data/'+movieRequest+'/';
								
								poster_path = localImageDir+requestInitialDetails.poster_path;
								backdrop_path = localImageDir+requestInitialDetails.backdrop_path;
								id = requestInitialDetails.id;
								original_name = requestInitialDetails.original_title;
									
								xhrCall("http://api.themoviedb.org/3/movie/" + id + "?api_key="+api_key+"&=", function(response) {
								
									var secondRequestResponse = JSON.parse(response);
									
									genre = secondRequestResponse.genres[0].name;
									runtime = secondRequestResponse.runtime;
									imdb_id = secondRequestResponse.imdb_id;
									// Needs seperate call
									// rating = secondRequestResponse.rating;
									// certification = requestInitialDetails.certification;
									overview = secondRequestResponse.overview;

									
									//Setting up array for writing
									var scraperdata = new Array()
									,scraperdataset = null;
									
									scraperdataset = { path:incommingMovieTitle, id:id, genre:genre, runtime:runtime, original_name:original_name, imdb_id:imdb_id, rating:rating, certification:certification, overview:overview, poster:poster_path, backdrop:backdrop_path, cdNumber:cdNumber }
									scraperdata[scraperdata.length] = scraperdataset;
									var scraperdataJSON = JSON.stringify(scraperdata, null, 4);
									
									fs.writeFile('./public/movies/data/'+movieRequest+'/data.js', scraperdataJSON, function(e) {
										if (!e) {
											fs.readFile('./public/movies/data/'+movieRequest+'/data.js', 'utf8', function (err, data) {
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
							};
						}); 
					};
				});
			}
		});
	};
	

	
	function downloadCache(response,callback){
		if(typeof response){
			var size = "w1920";
			if (configfileResults.highres === 'yes'){
				size = "w1920"
			} else if (configfileResults.highres === 'no'){
				size = "w1280"
			};
				
			var backdrop_url = "http://cf2.imgobject.com/t/p/"+size+"/"
			, poster_url = "http://cf2.imgobject.com/t/p/w342/"
			, poster = poster_url+response.poster_path
			, backdrop = backdrop_url+response.backdrop_path
			, downloadDir = './public/movies/data/'+movieRequest+'/';
			
			downloader.on('done', function(msg) { console.log('done', msg); });
			downloader.on('error', function(msg) { console.log('error', msg); });
			downloader.download(poster, downloadDir);
			downloader.download(backdrop, downloadDir);
		}else{
			var poster = posterpath
			, backdrop = backdroppath;
		};
		callback(poster,backdrop);
	};

};



function xhrCall(url,callback) { 
	request({
		url: url,
		headers: {"Accept": "application/json"},
		method: "GET"
	}, function (error, response, body) {
		if(!error){
			callback(body);
		}else{
			console.log('XHR Error',error);
		}
	});
};



function updateMovies(req, res, callback) { 
	var movielistpath = './public/movies/data/movieindex.js'
	, status = null
	, dir = configfileResults.moviepath;
	
	console.log('Getting movies from:', dir)
	fs.readdir(dir,function(err,files){
		if (err){
			status = 'wrong or bad directory, please specify a existing directory';
			console.log(status);
			callback(status);
		}else{
			var allMovies = new Array();
			files.forEach(function(file){
				var fullPath = dir + file
				stats = fs.lstatSync(fullPath);
				if (stats.isDirectory(file)) {
					var subPath = dir + file
					, files = fs.readdirSync(subPath);
					console.log('found subdir files', file+'/'+files)
					allMovies.push(file+'/'+files);
				} else {
					if (file.match(/\.(avi|mkv|mp4|mpeg|mov)/)){
						movieFiles = file
						allMovies[allMovies.length] = movieFiles;
					}
				}
			});
			var allMoviesJSON = JSON.stringify(allMovies, null, 4);
			fs.writeFile(movielistpath, allMoviesJSON, function(e) {
				if (!e) {
					console.log('Updating movielist', allMoviesJSON);
					callback(status);
				}else{ 
					console.log('Error getting movielist', e);
				};
			});
		};
	});
};