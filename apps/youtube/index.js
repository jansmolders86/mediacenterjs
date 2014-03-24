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

// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
exports.engine = 'jade';


// Render the indexpage
var Youtube = require('youtube-api')
, iso8601 = require('./iso8601.js')
, fs = require('fs')
, ini = require('ini')
, jade = require('jade')
, configuration_handler = require('../../lib/handlers/configuration-handler')
, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'));

exports.index = function(req, res, next){
	res.render('youtube');
};
exports.post = function(req, res, next) {
	var infoRequest = req.params.id;
	switch(infoRequest) {
		case 'updateToken':
			config.oauth = req.body.oauth;
			configuration_handler.saveSettings(config, function () {
				res.json({message: 'Success'});
			});
		break;
		case 'searchYoutube':
			searchYoutube(req, function (error, searchResults) {
				if(error) {
					res.json(500, {message: error});
				} else {
					parseVideoData(searchResults, function (videos) {
						res.json({'videos': videos});
					});
				}
			});
		break;
	}
};
exports.get = function(req, res, next) {
	var infoRequest = req.params.id;
	switch(infoRequest) {
		case 'index':
			Youtube.authenticate({
				type: "oauth",
				token: config.oauth
			});
			// TODO Currently uses most popular videos to display because getting personal activity feed has no view counts
			Youtube.videos.list({"part": "snippet,statistics,contentDetails", "chart": "mostPopular", "maxResults": 50}, function (error, activityData) {
				if( error instanceof Error ) {
					console.log('Error searching Youtube', error);
					res.json(500, {"error":'Problem getting content from YouTube.'});
					return;
				} else if(error) {
					res.json(500, {"error":'Need to re-authenticate to Google, popup in '});
					return;
				}
				parseVideoData(activityData, function (videos) {
					res.json({"videos": videos});
				});
			});
		break;
		case 'getVideo':
			getVideo(req, function (error, videoResult) {
				if(error) {
					res.json({message: error}, 500);
				} else {
					parseVideoData(videoResult, function (video) {
						res.json({'videos': video});
					});
				}
			});
		break;
		case 'getKey':
			if(config.oauthKey) {
				res.json({key: config.oauthKey});
			} else {
				res.json(500, {error: 'Oauth key missing in config file, please update!'});
			}
		break;
	}
};

/**
 * Searches youtube given the query as the input parameter from the POST request
 * @param  {Object}   request  The request from the user
 * @param  {Function} callback Callback function to send back
 * @return {Function} callback ^
 */
function searchYoutube(request, callback) {
	Youtube.authenticate({
		type: "oauth",
		token: config.oauth
	});
	Youtube.search.list({q: request.body.q, part: 'snippet', maxResults: 50}, function (error, result) {
		if(error) {
			return callback(error);
		}
		//return callback(null, );
		var videoArray = [];
		for(var videoCounter in result.items) {
			var videoId = result.items[videoCounter].id.videoId;
			videoArray.push(videoId);
		}
		Youtube.videos.list({part: 'snippet,statistics,contentDetails', id: videoArray.join(',')}, function (error, result) {
			return callback(null, result);
		});
	});
}

/**
 * Gets a particular video metadata given its youtube ID
 * @param  {Object}   request  The request from the user
 * @param  {Function} callback Callback function to send back
 * @return {Function} callback ^
 */
function getVideo(request, callback) {
	if(!request.query.id) {
		return callback('Missing ID');
	}
	Youtube.authenticate({
		type: "oauth",
		token: config.oauth
	});
	Youtube.videos.list({part: 'snippet,statistics,contentDetails', id: request.query.id}, function (error, result) {
		return callback(null, result);
	});
}

/*http://stackoverflow.com/a/8363049/1612721*/
function createDateString(createdDate) {
	return createdDate.getUTCFullYear() +"/"+
	("0" + (createdDate.getUTCMonth()+1)).slice(-2) +"/"+
	("0" + createdDate.getUTCDate()).slice(-2) + " " +
	("0" + createdDate.getUTCHours()).slice(-2) + ":" +
	("0" + createdDate.getUTCMinutes()).slice(-2) + ":" +
	("0" + createdDate.getUTCSeconds()).slice(-2) + " UTC";
}

/*Converts iso8601 standard to human readable duration*/
function getDuration(iso8601Duration) {
	var durationInSeconds = iso8601.parseToTotalSeconds(iso8601Duration);
	return Math.floor(durationInSeconds/60) + ':' + ('0' + durationInSeconds%60).slice(-2);
}

/**
 * Parses the video content from Youtube and returns only the data we want
 * @param  {Array}   data     The data from Youtube
 * @param  {Function} callback Callback function to send back
 * @return {Function} callback ^
 */
function parseVideoData(data, callback) {
	var videos = [];
	for(var videoCounter in data.items) {
		var createdDate = new Date(data.items[videoCounter].snippet.publishedAt);
		var dateString = createDateString(createdDate);
		var videoObj = {
			"title": data.items[videoCounter].snippet.title,
			"synopsis": data.items[videoCounter].snippet.description,
			"image": data.items[videoCounter].snippet.thumbnails.high.url,
			"channelTitle": data.items[videoCounter].snippet.channelTitle,
			"videoID": data.items[videoCounter].id,
			"viewCount": data.items[videoCounter].statistics.viewCount,
			"duration": getDuration(data.items[videoCounter].contentDetails.duration),
			"createdDate": dateString
		};
		videos.push(videoObj);
	}
	return callback(videos);
}