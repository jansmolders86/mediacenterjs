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
, promisify = require('deferred').promisify
, deferred = require('deferred')
, readdir = promisify(fs.readdir)
, exists = promisify(fs.exists)
, writeFile = promisify(fs.writeFile)
, filepath = './public/movies/config/moviefiles.js'
, i=0
//, server = require('http').createServer(app)
//, io = require('socket.io').listen(server);

//server.listen(300);	
exports.engine = 'jade';

var configfile = []
,configfilepath = './configuration/setup.js'
,configfile = fs.readFileSync(configfilepath)
,configfileResults = JSON.parse(configfile);	
	
var moviefiles = []
,moviefilepath = './public/movies/config/moviefiles.js'
,moviefiles = fs.readFileSync(moviefilepath)
,moviefileResults = JSON.parse(moviefiles)	

	
// Render the indexpage
exports.update = function(req, res, next){
	// Set max of events to unlimited
	req.setMaxListeners(0)

	readdir(configfileResults.moviepath).map(function (file) {
		var filename = file
		, year = filename.match(/\(.*?([0-9]{4}).*?\)/)
		, stripped = filename.replace(/\.|_|\/|\+|-/g," ")
		, noyear = stripped.replace(/([0-9]{4})|\(|\)|\[|\]/g,"")
		, releasegroups = noyear.replace(/FxM|aAF|arc|AAC|MLR|AFO|TBFA|WB|ARAXIAL|UNiVERSAL|ToZoon|PFa|SiRiUS|Rets|BestDivX|NeDiVx|SER|ESPiSE|iMMORTALS|QiM|QuidaM|COCAiN|DOMiNO|JBW|LRC|WPi|NTi|SiNK|HLS|HNR|iKA|LPD|DMT|DvF|IMBT|LMG|DiAMOND|DoNE|D0PE|NEPTUNE|TC|SAPHiRE|PUKKA|FiCO|PAL|aXXo|VoMiT|ViTE|ALLiANCE|mVs|XanaX|FLAiTE|PREVAiL|CAMERA|VH-PROD|BrG|replica|FZERO/g, "")
		, movietype = releasegroups.replace(/dvdrip|multi9|xxx|web|hdtv|vhs|embeded|embedded|ac3|dd5 1|m sub|x264|dvd5|dvd9|multi sub|non sub|subs|ntsc|ingebakken|torrent|torrentz|bluray|brrip|sample|xvid|cam|camrip|wp|workprint|telecine|ppv|ppvrip|scr|screener|dvdscr|bdscr|ddc|R5|telesync|telesync|pdvd|1080p|hq|sd|720p|hdrip/gi, "")
		, noCountries = movietype.replace(/NL|SWE|SWESUB|ENG|JAP|BRAZIL|TURKIC|slavic|SLK|ITA|HEBREW|HEB|ESP|RUS|DE|german|french|FR|ESPA|dansk|HUN/g,"")
		, movieTitle = noCountries.replace(/avi|mkv|mpeg|mpg|mov|mp4|wmv|txt/gi,"").trimRight()
		if (year == null) year = ''
		var url = "http://api.themoviedb.org/2.1/Movie.search/"+configfileResults.language+"/json/1d0a02550b7d3eb40e4e8c47a3d8ffc6/"+movieTitle+"?year="+ year +"?="
		return getFile(url)(function (ajaxResult) {
			return {
				movieTitle:movieTitle,
				filename: file,
				movieScraperInfo: ajaxResult
			};
		});
	})(function (data) {
	   return writeFile(filepath, JSON.stringify(data, null, 4));
	}).end(function () {
		// Download Cache
		//io.sockets.on('connection', function (client) { client.emit('chat', 'Building database complete. Proceeding with cache') });
		downloadCache()
	}, function (e) {
		console.log("Failed", e);
	});


	
	// Get Scraper info
	function getFile(url) {
		var def = deferred()
		, xhr = new XMLHttpRequest();
		xhr.open("GET", url, true); 
		xhr.onerror = function () {
			def.resolve(new Error(this.responseText));
		};
		xhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status >= 200 && this.status < 300 || this.status === 304) {
				console.log('get', i++); 
				def.resolve(eval(this.responseText)[0]);
			}
		};
		//xhr.timeout = 10000;
		xhr.send(null);
		return def.promise;
	};
	
	
	function downloadCache(){
		// Download images to cache
		console.log('getting images of movies. Using high quality:', configfileResults.highres)
		for(i=0; i < moviefileResults.length; i++) {
			// Get the correct images from the scraper

			if (typeof moviefileResults[i].movieScraperInfo) {
			
				if (configfileResults.highres === 'yes'){
					var posterPath = moviefileResults[i].movieScraperInfo.posters[2].image.url
					, backdropPath = moviefileResults[i].movieScraperInfo.backdrops[3].image.url
				} else if (configfileResults.highres === 'no'){
					var posterPath = moviefileResults[i].movieScraperInfo.posters[1].image.url
					, backdropPath = moviefileResults[i].movieScraperInfo.backdrops[2].image.url;
				}
				
				var downloadDir = './public/movies/cache/'
				, localFileNamePoster = posterPath.match(/[^//]+$/i)
				, localFileNameBackdrop = posterPath.match(/[^//]+$/i);
				
				// Download the poster
				if (fs.existsSync(downloadDir+localFileNamePoster)) {
					console.log('File found on HDD')
				} else {
					downloader.on('done', function(msg) { console.log('done', msg); });
					downloader.on('error', function(msg) { console.log('error', msg); });
					downloader.download(posterPath, downloadDir);
					downloader.download(backdropPath, downloadDir);
				}
			}
		}
		res.redirect('/movies/')
	};
	
};


exports.details = function(req, res, next){	
	res.render('moviedetail',{
		movie: req.param('id'),
		movies: moviefileResults
	});
};
	
exports.index = function(req, res, next){		
	res.render('movies',{
		movies: moviefileResults,
		configuration: configfileResults.highres
	});
};

exports.play = function(req, res, next){
   /* var filePath = 
    var stat = fs.statSync(filePath);

    response.writeHead(200, {
        'Content-Type': 'video/avi',
        'Content-Length': stat.size
    });

    var readStream = fs.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to util.pump()
    util.pump(readStream, response);*/
}

