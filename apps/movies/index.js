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
, movielistpath = './public/movies/config/moviefiles.js'
, scraperinfopath = './public/movies/config/scraperinfo.js'

exports.engine = 'jade';

var configfile = []
,configfilepath = './configuration/setup.js'
,configfile = fs.readFileSync(configfilepath)
,configfileResults = JSON.parse(configfile);	
	
var moviefiles = []
,moviefilepath = './public/movies/config/moviefiles.js'
,moviefiles = fs.readFileSync(moviefilepath)
,moviefileResults = JSON.parse(moviefiles)	

/*var scraperinfo = []
,scraperInfoPath = './public/movies/config/scraperinfo.js'
,scraperInfo = fs.readFileSync(scraperInfoPath)
,scraperInfoResults = JSON.parse(scraperInfo)	*/



//Get all movie files and ignore other files. (str files will be handled later)
fs.readdir(configfileResults.moviepath,function(err,files){
    if (err) throw err;
	var allMovies = new Array();
    files.forEach(function(file){
		if (file.match(/\.(avi|mkv|mpeg|mpg|mov|mp4|txt)/i,"")){
			movieFiles = file
			/*, year = movieFiles.match(/\(.*?([0-9]{4}).*?\)/)
			, stripped = movieFiles.replace(/\.|_|\/|\+|-/g," ")
			, noyear = stripped.replace(/([0-9]{4})|\(|\)|\[|\]/g,"")
			, releasegroups = noyear.replace(/FxM|aAF|arc|AAC|MLR|AFO|TBFA|WB|ARAXIAL|UNiVERSAL|ToZoon|PFa|SiRiUS|Rets|BestDivX|NeDiVx|SER|ESPiSE|iMMORTALS|QiM|QuidaM|COCAiN|DOMiNO|JBW|LRC|WPi|NTi|SiNK|HLS|HNR|iKA|LPD|DMT|DvF|IMBT|LMG|DiAMOND|DoNE|D0PE|NEPTUNE|TC|SAPHiRE|PUKKA|FiCO|PAL|aXXo|VoMiT|ViTE|ALLiANCE|mVs|XanaX|FLAiTE|PREVAiL|CAMERA|VH-PROD|BrG|replica|FZERO/g, "")
			, movietype = releasegroups.replace(/dvdrip|multi9|xxx|web|hdtv|vhs|embeded|embedded|ac3|dd5 1|m sub|x264|dvd5|dvd9|multi sub|non sub|subs|ntsc|ingebakken|torrent|torrentz|bluray|brrip|sample|xvid|cam|camrip|wp|workprint|telecine|ppv|ppvrip|scr|screener|dvdscr|bdscr|ddc|R5|telesync|telesync|pdvd|1080p|hq|sd|720p|hdrip/gi, "")
			, noCountries = movietype.replace(/NL|SWE|SWESUB|ENG|JAP|BRAZIL|TURKIC|slavic|SLK|ITA|HEBREW|HEB|ESP|RUS|DE|german|french|FR|ESPA|dansk|HUN/g,"")
			, movieTitle = noCountries.trimRight()*/
			
			allMovies[allMovies.length] = movieFiles;
		}
    });
	var allMoviesJSON = JSON.stringify(allMovies, null, 4);
	fs.writeFile(movielistpath, allMoviesJSON, function(e) {
		if (!e) {
			console.log('writing', allMoviesJSON);
		}else{ 
			console.log('Error getting movielist', e)
		};
	});
});


	
exports.index = function(req, res, next){		
	res.render('movies',{
		movies: moviefileResults,
		configuration: configfileResults.highres
	});
};




exports.post = function(req, res, next){		
	console.log('body: ' + eval(req.body));
		
	/*
	
	// Get Scraper info
	function getScraperInfo() {
		moviefileResults.forEach(function(file){
			var filename = file
			, result = null
			, xhr = new XMLHttpRequest()
			, year = filename.match(/\(.*?([0-9]{4}).*?\)/)
			, stripped = filename.replace(/\.|_|\/|\+|-/g," ")
			, noyear = stripped.replace(/([0-9]{4})|\(|\)|\[|\]/g,"")
			, releasegroups = noyear.replace(/FxM|aAF|arc|AAC|MLR|AFO|TBFA|WB|ARAXIAL|UNiVERSAL|ToZoon|PFa|SiRiUS|Rets|BestDivX|NeDiVx|SER|ESPiSE|iMMORTALS|QiM|QuidaM|COCAiN|DOMiNO|JBW|LRC|WPi|NTi|SiNK|HLS|HNR|iKA|LPD|DMT|DvF|IMBT|LMG|DiAMOND|DoNE|D0PE|NEPTUNE|TC|SAPHiRE|PUKKA|FiCO|PAL|aXXo|VoMiT|ViTE|ALLiANCE|mVs|XanaX|FLAiTE|PREVAiL|CAMERA|VH-PROD|BrG|replica|FZERO/g, "")
			, movietype = releasegroups.replace(/dvdrip|multi9|xxx|web|hdtv|vhs|embeded|embedded|ac3|dd5 1|m sub|x264|dvd5|dvd9|multi sub|non sub|subs|ntsc|ingebakken|torrent|torrentz|bluray|brrip|sample|xvid|cam|camrip|wp|workprint|telecine|ppv|ppvrip|scr|screener|dvdscr|bdscr|ddc|R5|telesync|telesync|pdvd|1080p|hq|sd|720p|hdrip/gi, "")
			, noCountries = movietype.replace(/NL|SWE|SWESUB|ENG|JAP|BRAZIL|TURKIC|slavic|SLK|ITA|HEBREW|HEB|ESP|RUS|DE|german|french|FR|ESPA|dansk|HUN/g,"")
			, movieTitle = noCountries.replace(/avi|mkv|mpeg|mpg|mov|mp4|wmv|txt/gi,"").trimRight()
			if (year == null) year = ''
			var scraperResults = getFile("http://api.themoviedb.org/2.1/Movie.search/"+configfileResults.language+"/json/1d0a02550b7d3eb40e4e8c47a3d8ffc6/"+movieTitle+"?year="+ year +"?=")
		}
	};
	
	
	
	// Get Scraper info by doing a synchronous AJAX call  
	function getFile(url, callback) { 
		xhr = new XMLHttpRequest();  
		var results = []
		// Make it synchronous by adding 'false'
		xhr.open("GET", url, false);  
		xhr.onreadystatechange = function(){
			// If status is ready
			if (this.readyState == 4 && this.status >= 200 && this.status < 300 || this.status === 304) {
				results = eval(this.responseText)
			} else if (this.status === 401){
				console.log('Error 401')
			};
		};
		xhr.send(null);
		// Return a array with movie info
		return results[0]
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
	};*/

	res.send(req.body);
};




/*Changing the way the movie app works to save up memory. I'm moving request for the elements to the frontend in a callback of caroufredsel.
This change currently breaks the movie section of MCJS. */


exports.details = function(req, res, next){	
	res.render('moviedetail',{
		movie: req.param('id'),
		movies: moviefileResults
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
    util.pump(readStream, response);
*/
}
