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

exports.engine = 'jade';

/* Modules */
var express = require('express')
, app = express()
, fs = require('fs')
, downloader = require('downloader')
, request = require("request")
, ffmpeg = require('fluent-ffmpeg')
, probe = require('node-ffprobe')
, rimraf = require('rimraf')
, util = require('util')
, helper = require('../../lib/helpers.js')
, Encoder = require('node-html-encoder').Encoder
, encoder = new Encoder('entity')
, Trakt = require('trakt')
, trakt = new Trakt({username: 'mediacenterjs', password: 'mediacenterjs'}); 

/* Get Config */
var configfile = []
,configfilepath = './configuration/setup.js'
,configfile = fs.readFileSync(configfilepath)
,configfileResults = JSON.parse(configfile);	

exports.index = function(req, res, next){	

	var writePath = './public/tv/data/tvindex.js'
	, getDir = true
	, dir = configfileResults.tvpath
	, fileTypes = new RegExp("\.(avi|mkv|mpeg|mov|mp4)","g");;

	helper.getLocalFiles(req, res, dir, writePath, getDir, fileTypes,  function(status){
		var tvfiles = []
		,tvfilepath = './public/tv/data/tvindex.js'
		,tvfiles = fs.readFileSync(tvfilepath)
		,tvfileResults = JSON.parse(tvfiles)	
		
		res.render('tv',{
			tvshows:tvfileResults,
			status:status
		});
	});

};


exports.post = function(req, res, next){	
	var tvTitle = null
	, id = 'No data found...'
	, title = 'No data found...'
	, genre = 'No data found...'
	, certification = 'No data found...'
	, banner = '/tv/images/banner.png'
	
	var scraperdata = new Array()
	, scraperdataset = null;

	var incommingFile = req.body
	, tvRequest = incommingFile.tvTitle

	console.log('Getting data for tv show', tvRequest);
	//Check if folder already exists
	if (fs.existsSync('./public/tv/data/'+tvRequest)) {
		if(fs.existsSync('./public/tv/data/'+tvRequest+'/data.js')){
			fs.stat('./public/tv/data/'+tvRequest+'/data.js', function (err, stats) {
				// If data file is created without data, we remove it (rm -rf using module RimRaf).
				if(stats.size == 0){
					rimraf('./public/tv/data/'+tvRequest, function (e) {
						if(!e){
							console.log('Removed bad dir', tvRequest);
							res.redirect('/tv/')
						} else {
							console.log('Removing dir error:', e)
						}
					});
				} else {
					// Read cached file and send to client.
					fs.readFile('./public/tv/data/'+tvRequest+'/data.js', 'utf8', function (err, data) {
						if(!err){
							res.send(data);
						}else if(err){
							rimraf('./public/tv/data/'+tvRequest, function (e) {
								if(!e){
									console.log('Removed bad dir', tvRequest);
									res.redirect('/tv/')
								} else {
									console.log('Removing dir error:', e)
								}
							});
						}
					});
				}
			});
		} else {
			rimraf('./public/tv/data/'+tvRequest, function (e) {
				if(!e){
					console.log('Removed bad dir', tvRequest);
					res.redirect('/tv/')
				} else {
					console.log('Removing dir error:', e)
				}
			});
		}
	} else {
		console.log('New movie, getting details')
		fs.mkdir('./public/tv/data/'+tvRequest, 0777, function (err) {
			if (err) {
				console.log('Error creating folder',err);
			
				scraperdataset = { title:title, genre:genre, certification:certification, banner:banner }
				scraperdata[scraperdata.length] = scraperdataset;
				var scraperdataJSON = JSON.stringify(scraperdata, null, 4);
				writeToFile(scraperdataJSON);	
			} else {
				console.log('Directory '+tvRequest+' created');

				var options = { query: tvRequest }
				trakt.request('search', 'shows', options, function(err, result) {
					if (err) {
						console.log('error retrieving tvshwo info', err);
					} else {
						var tvSearchResult = result[0]
						
						downloadCache(tvSearchResult,function(banner) {
								var localImageDir = '/tv/data/'+tvRequest+'/',
								localCover = banner.match(/[^/]+$/);
								
								banner = localImageDir+localCover;
								title = tvSearchResult.title
								genre = tvSearchResult.genre
								certification = tvSearchResult.certification

								scraperdataset = { title:title, genre:genre, certification:certification, banner:banner }
								scraperdata[scraperdata.length] = scraperdataset;
								var scraperdataJSON = JSON.stringify(scraperdata, null, 4);
								writeToFile(scraperdataJSON);	

						}); 
					}
				});
			}
		});
	};
	
	function writeToFile(scraperdataJSON){
		setTimeout(function(){
			fs.writeFile('./public/tv/data/'+tvRequest+'/data.js', scraperdataJSON, function(e) {
				if (!e) {
					fs.readFile('./public/tv/data/'+tvRequest+'/data.js', 'utf8', function (err, data) {
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
		},1000);	
	}
	
	
	function downloadCache(tvSearchResult,callback){
		var banner = tvSearchResult.images.banner
		, downloadDir = './public/tv/data/'+tvRequest+'/';
		
		downloader.on('done', function(msg) { console.log('done', msg); });
		downloader.on('error', function(msg) { console.log('error', msg); });
		downloader.download(banner, downloadDir);

		callback(banner);
	};

};
