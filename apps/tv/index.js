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
, fs = require('fs.extra')
, downloader = require('downloader')
, file_utils = require('../../lib/utils/file-utils')
, ajax_utils = require('../../lib/utils/ajax-utils')
, app_cache_handler = require('../../lib/handlers/app-cache-handler')
, Trakt = require('trakt')
, trakt = new Trakt({username: 'mediacenterjs', password: 'mediacenterjs'})
, colors = require('colors')
, config = require('../../lib/handlers/configuration-handler').getConfiguration();

exports.index = function(req, res, next){	
	var dir = config.tvpath
	, fileTypes = new RegExp("\.(avi|mkv|mpeg|mov|mp4)","g");;

	file_utils.getLocalFiles(dir, fileTypes, function(status, files){
		res.render('tv',{
			tvshows: files,
			selectedTheme: config.theme,
			status: status
		});
	});

};


exports.post = function(req, res, next){	
	var title = 'No data found...'
	, genre = 'No data found...'
	, certification = 'No data found...'
	, banner = '/tv/images/banner.png';

	var incommingFile = req.body
	, tvRequest = incommingFile.tvTitle;

	//Check if folder already exists
	app_cache_handler.ensureCacheDirExists('tv', tvRequest);
	checkDirForCorruptedFiles(tvRequest);

	var options = { query: tvRequest };
	trakt.request('search', 'shows', options, function(err, result) {
		if (err) {
			console.log('error retrieving tvshow info', err .red);
		} else {
			var tvSearchResult = result[0];
			if (tvSearchResult !== undefined && tvSearchResult !== '' && tvSearchResult !== null) {
				downloadCache(tvSearchResult,function(banner) {
						var localImageDir = '/data/tv/'+tvRequest+'/',
						localCover = banner.match(/[^/]+$/);

						banner = localImageDir+localCover;
						title = tvSearchResult.title;
						genre = tvSearchResult.genre;
						certification = tvSearchResult.certification;

						writeData(title,genre,certification,banner);
				});
			} else {
				writeData(title,genre,certification,banner);
			}
		}
	});
	
	
	function downloadCache(tvSearchResult,callback){
		if (typeof tvSearchResult){
			var banner = tvSearchResult.images.banner
			, downloadDir = app_cache_handler.getCacheDir('tv', tvRequest) + '/';
			
			downloader.on('done', function(msg) { console.log('done', msg .green); });
			downloader.on('error', function(msg) { console.log('error', msg .red); });
			downloader.download(banner, downloadDir);
		} else{
			banner = '/tv/images/banner.png';
		}
		callback(banner);
	}

	function checkDirForCorruptedFiles(tvRequest){
		var checkDir = app_cache_handler.getCacheDir('tv', tvRequest);
		
		if(fs.existsSync(checkDir + '/data.js')){
			fs.stat(checkDir + '/data.js', function (err, stats) {
				if(stats.size == 0){
					file_utils.removeBadDir(checkDir, res.send);
				} else {
					fs.readFile(checkDir + '/data.js', 'utf8', function (err, data) {
						if(!err) {
							res.send(data);
						} else {
							file_utils.removeBadDir(checkDir, res.send);
						}
					});
				}
			});
		} else {
			file_utils.removeBadDir(checkDir, res.send);
		}
	}
	
	function writeData(title,genre,certification,banner){		
		var scraperdata = [];

		scraperdata[0] = { title:title, genre:genre, certification:certification, banner:banner };
		var dataToWrite = JSON.stringify(scraperdata, null, 4);
		var writePath = app_cache_handler.getCacheDir('tv', tvRequest) + '/data.js';

		ajax_utils.writeToFile(writePath, dataToWrite, function(data) {
			res.send(data);
		});
	}
};
