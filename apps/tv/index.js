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
, trakt = new Trakt({username: 'mediacenterjs', password: 'mediacenterjs'})
, colors = require('colors'); 

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

	//Check if folder already exists
	if (fs.existsSync('./public/tv/data/'+tvRequest)) {
		checkDirForCorruptedFiles(tvRequest)
	} else {
		fs.mkdir('./public/tv/data/'+tvRequest, 0777, function (err) {
			if (err) {
				console.log('Error creating folder',err .red);
			
				scraperdataset = { title:title, genre:genre, certification:certification, banner:banner }
				scraperdata[scraperdata.length] = scraperdataset;
				var dataToWrite = JSON.stringify(scraperdata, null, 4);
				var writePath = './public/tv/data/'+tvRequest+'/data.js'
				helper.writeToFile(req,res,writePath,dataToWrite)				
				
			} else {
				console.log('Directory '+tvRequest+' created');

				var options = { query: tvRequest }
				trakt.request('search', 'shows', options, function(err, result) {
					if (err) {
						console.log('error retrieving tvshow info', err .red);
					} else {
						var tvSearchResult = result[0];
						
						if (tvSearchResult !== undefined && tvSearchResult !== '' && tvSearchResult !== null) {
							downloadCache(tvSearchResult,function(banner) {
									var localImageDir = '/tv/data/'+tvRequest+'/',
									localCover = banner.match(/[^/]+$/);
									
									banner = localImageDir+localCover;
									title = tvSearchResult.title
									genre = tvSearchResult.genre
									certification = tvSearchResult.certification

									scraperdataset = { title:title, genre:genre, certification:certification, banner:banner }
									scraperdata[scraperdata.length] = scraperdataset;
									var dataToWrite = JSON.stringify(scraperdata, null, 4);
									var writePath = './public/tv/data/'+tvRequest+'/data.js'
									helper.writeToFile(req,res,writePath,dataToWrite)	

							}); 
						} else {
							scraperdataset = { title:title, genre:genre, certification:certification, banner:banner }
							scraperdata[scraperdata.length] = scraperdataset;
							var dataToWrite = JSON.stringify(scraperdata, null, 4);
							var writePath = './public/tv/data/'+tvRequest+'/data.js'
							helper.writeToFile(req,res,writePath,dataToWrite)	
						}
					}
				});
			}
		});
	};
	
	
	function downloadCache(tvSearchResult,callback){
		if (typeof tvSearchResult){
			var banner = tvSearchResult.images.banner
			, downloadDir = './public/tv/data/'+tvRequest+'/';
			
			downloader.on('done', function(msg) { console.log('done', msg .green); });
			downloader.on('error', function(msg) { console.log('error', msg .red); });
			downloader.download(banner, downloadDir);
		} else{
			banner = '/tv/images/banner.png'
		}
		callback(banner);
	};

	function checkDirForCorruptedFiles(tvRequest){
		var checkDir = './public/tv/data/'+tvRequest
		
		if(fs.existsSync('./public/tv/data/'+tvRequest+'/data.js')){
			fs.stat('./public/tv/data/'+tvRequest+'/data.js', function (err, stats) {		
				if(stats.size == 0){
					helper.removeBadDir(req, res, checkDir)
				} else {
					fs.readFile('./public/tv/data/'+tvRequest+'/data.js', 'utf8', function (err, data) {
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
