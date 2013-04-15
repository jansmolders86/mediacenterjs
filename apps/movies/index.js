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

var express = require('express')
, app = express()
, fs = require('fs')
, sys = require('util')
, XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
, downloader = require('downloader')
, movielistpath = './public/movies/data/movieindex.js';

exports.engine = 'jade';

var configfile = []
,configfilepath = './configuration/setup.js'
,configfile = fs.readFileSync(configfilepath)
,configfileResults = JSON.parse(configfile);	


exports.index = function(req, res, next){	
	updateMovies(function(){
		var moviefiles = []
		,moviefilepath = './public/movies/data/movieindex.js'
		,moviefiles = fs.readFileSync(moviefilepath)
		,moviefileResults = JSON.parse(moviefiles)	
		
		res.render('movies',{
			movies: moviefileResults,
			configuration: configfileResults.highres
		});
	});
};

//Manual update
exports.update = function(req, res){		
	updateMovies(function(){
		res.redirect('/movies');
	});	
};

//Generic update function
function updateMovies(callback) { 
	var movielistpath = './public/movies/data/movieindex.js'
	
	console.log('Gettign movies from:', configfileResults.moviepath)
	fs.readdir(configfileResults.moviepath,function(err,files){
		if (err) throw err;
		var allMovies = new Array();
		files.forEach(function(file){
			if (file.match(/\.(bmp|jpg|png|gif|mp3|sub|srt|txt|doc|docx|pdf|nfo|cbr|xml|idx|exe|rar|zip|7z|diz|par|torrent|par2|ppt|info|md|db)/)){
				return
			} else {
				movieFiles = file
				allMovies[allMovies.length] = movieFiles;
			}
		});
		var allMoviesJSON = JSON.stringify(allMovies, null, 4);
		fs.writeFile(movielistpath, allMoviesJSON, function(e) {
			if (!e) {
				console.log('writing', allMoviesJSON);
				callback();
			}else{ 
				console.log('Error getting movielist', e);
			};
		});
	});
};



exports.post = function(req, res, next){	
	//Defaults
	var movieTitle = null
	, cdNumber = null
	, posterpath = '/movies/css/img/nodata.jpg'
	, backdroppath = '/movies/css/img/overlay.png'
	, original_name = 'No data found...'
	, imdb_id = 'No data found...'
	, rating = 'No data found...'
	, certification = 'No data found...'
	, overview = 'No data found...';

	
	var movieRequest = req.body;
	console.log('movierequest', movieRequest.movieTitle)
	
	//Check if folder already exists
	if (fs.existsSync('./public/movies/data/'+movieRequest.movieTitle)) {
		// Read cached file and send to client.
		fs.readFile('./public/movies/data/'+movieRequest.movieTitle+'/data.js', 'utf8', function (err, data) {
			if(!err){
				console.log(data)
				res.send(data);
			}else{
				console.log('Cannot read scraper data', err)
			}
		});
	} else {
		console.log('New movie, getting details')
		fs.mkdir('./public/movies/data/'+movieRequest.movieTitle, 0777, function (err) {
			if (err) {
				console.log('Error creating folder',err);
			} else {
				console.log('Directory '+movieRequest.movieTitle+' created');

				// Building scraper url
				var filename = movieRequest.movieTitle
				, year = filename.match(/\(.*?([0-9]{4}).*?\)/)
				, stripped = filename.replace(/\.|_|\/|\+|\-/g," ")
				, noyear = stripped.replace(/([0-9]{4})|\(|\)|\[|\]/g,"")
				, releasegroups = noyear.replace(/FxM|aAF|arc|AAC|MLR|AFO|TBFA|WB|ARAXIAL|UNiVERSAL|ToZoon|PFa|SiRiUS|Rets|BestDivX|NeDiVx|SER|ESPiSE|iMMORTALS|QiM|QuidaM|COCAiN|DOMiNO|JBW|LRC|WPi|NTi|SiNK|HLS|HNR|iKA|LPD|DMT|DvF|IMBT|LMG|DiAMOND|DoNE|D0PE|NEPTUNE|TC|SAPHiRE|PUKKA|FiCO|PAL|aXXo|VoMiT|ViTE|ALLiANCE|mVs|XanaX|FLAiTE|PREVAiL|CAMERA|VH-PROD|BrG|replica|FZERO/g, "")
				, movietype = releasegroups.replace(/dvdrip|multi9|xxx|web|hdtv|vhs|embeded|embedded|ac3|dd5 1|m sub|x264|dvd5|dvd9|multi sub|non sub|subs|ntsc|ingebakken|torrent|torrentz|bluray|brrip|sample|xvid|cam|camrip|wp|workprint|telecine|ppv|ppvrip|scr|screener|dvdscr|bdscr|ddc|R5|telesync|telesync|pdvd|1080p|hq|sd|720p|hdrip/gi, "")
				, noCountries = movietype.replace(/NL|SWE|SWESUB|ENG|JAP|BRAZIL|TURKIC|slavic|SLK|ITA|HEBREW|HEB|ESP|RUS|DE|german|french|FR|ESPA|dansk|HUN/g,"")
				, noCD = noCountries.replace(/cd 1|cd 2|cd 3|cd 4|cd1|cd2|cd3|cd4/gi,"");
				
				cdNumber = filename.match(/cd 1|cd 2|cd 3|cd 4|cd1|cd2|cd3|cd4/gi,"");
				movieTitle = noCD.replace(/avi|mkv|mpeg|mpg|mov|mp4|wmv|txt/gi,"").trimRight();
				if (year == null) year = ''
				
				// Get scraper results (ajax call)
				getFile("http://api.themoviedb.org/2.1/Movie.search/"+configfileResults.language+"/json/1d0a02550b7d3eb40e4e8c47a3d8ffc6/"+movieTitle+"?year="+ year +"?=", function(scraperResult) {

					if (scraperResult != 'Nothing found.') {
						downloadCache(scraperResult,function(poster, backdrop) {
							console.log('Cache download completed');
							// Additional error check
							if(typeof scraperResult && scraperResult.posters.length > 2 && scraperResult.backdrops.length > 3){
								var localImageDir = '/movies/data/'+movieRequest.movieTitle+'/'
								,localPoster = poster.match(/[^//]+$/i) 
								,localBackdrop = backdrop.match(/[^//]+$/i);
								
								posterpath = localImageDir+localPoster
								backdroppath = localImageDir+localBackdrop;
								
								// Cleaning up scraper data: 
								// Usefull scraper result values to variables
								original_name = scraperResult.original_name
								imdb_id = scraperResult.imdb_id
								rating = scraperResult.rating
								certification = scraperResult.certification
								overview = scraperResult.overview;
							};
						});
					}; 
					
					//http://api.themoviedb.org/2.1/Genres.getList/en/xml/APIKEY  //TODO: get Genre, or even better, upgrade to 3.0
							
					//Setting up array for writing
					var scraperdata = new Array();
					var scraperdataset = null
					
					scraperdataset = { original_name:original_name, imdb_id:imdb_id, rating:rating, certification:certification, overview:overview, poster:posterpath, backdrop:backdroppath, cdNumber:cdNumber }
					scraperdata[scraperdata.length] = scraperdataset;
					var scraperdataJSON = JSON.stringify(scraperdata, null, 4);
					
					fs.writeFile('./public/movies/data/'+movieRequest.movieTitle+'/data.js', scraperdataJSON, function(e) {
						if (!e) {
							fs.readFile('./public/movies/data/'+movieRequest.movieTitle+'/data.js', 'utf8', function (err, data) {
								if(!err){
									console.log(data)
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
	
	function getFile(url,callback) { 
		xhr = new XMLHttpRequest();  
		var results = [];
		xhr.open("GET", url);  
		xhr.onreadystatechange = function(){
			if (this.readyState == 4 && this.status >= 200 && this.status < 300 || this.status === 304) {
				results = eval(this.responseText);
				callback(results[0]);
			} else if (this.status === 401){
				console.log('Error 401');
			};
		};
		xhr.send(null);
	};
	
	function downloadCache(scraperResult,callback){
		// Additional error check
		if(typeof scraperResult && scraperResult.posters.length > 2 && scraperResult.backdrops.length > 3){
			if (configfileResults.highres === 'yes'){
				var poster = scraperResult.posters[2].image.url
				, backdrop = scraperResult.backdrops[3].image.url
			} else if (configfileResults.highres === 'no'){
				var poster = scraperResult.posters[1].image.url
				, backdrop = scraperResult.backdrops[2].image.url;
			}
			var downloadDir = './public/movies/data/'+movieRequest.movieTitle+'/'
			downloader.on('done', function(msg) { console.log('done', msg); });
			downloader.on('error', function(msg) { console.log('error', msg); });
			downloader.download(poster, downloadDir);
			downloader.download(backdrop, downloadDir);
		}else{
			var poster = posterpath
			, backdrop = backdroppath
		};
		callback(poster,backdrop);
	};
};

exports.play = function(req, res, next){

	//TODO: Get player to work:  
	//TODO: Add nice curtain like animation (black divs from side to side closing into eachother)
	/*
	var filePath = 
	var stat = fs.statSync(filePath);

	response.writeHead(200, {
		'Content-Type': 'video/avi',
		'Content-Length': stat.size
	});

	var readStream = fs.createReadStream(filePath);
	// We replaced all the event handlers with a simple call to util.pump()
	util.pump(readStream, response);
	*/
};
