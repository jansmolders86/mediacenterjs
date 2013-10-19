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
	Youtube.authenticate({
		type: "oauth",
		token: config.oauth
	});
	// TODO Currently uses most popular videos to display because getting personal activity feed has no view counts
	Youtube.videos.list({"part": "snippet,statistics,contentDetails", "chart": "mostPopular", "maxResults": 50}, function (error, activityData) {
		if( error instanceof Error ) {
			console.log('Error searching Youtube', error);
			res.render('youtube', {"error":'Problem getting content from YouTube.'});
			return;
		} else if(error) {
			res.render('youtube', {"error":'Need to re-authenticate to Google, popup in '});
			return;
		}
		var videos = [];
		for(var videoCounter in activityData.items) {
			var createdDate = new Date(activityData.items[videoCounter].snippet.publishedAt);
			var dateString = createDateString(createdDate);
			var videoObj = {
				"title": activityData.items[videoCounter].snippet.title,
				"synopsis": activityData.items[videoCounter].snippet.description,
				"image": activityData.items[videoCounter].snippet.thumbnails.high.url,
				"channelTitle": activityData.items[videoCounter].snippet.channelTitle,
				"videoID": activityData.items[videoCounter].id,
				"viewCount": activityData.items[videoCounter].statistics.viewCount,
				"duration": getDuration(activityData.items[videoCounter].contentDetails.duration),
				"createdDate": dateString
			};
			videos.push(videoObj);
		}
		res.render('videos', {"videos": videos});
	});
};
exports.post = function(req, res, next) {
	var infoRequest = req.params.id;
	switch(infoRequest) {
		case 'updateToken':
			config.oauth = req.body.oauth;
			configuration_handler.saveSettings(config, function () {
				res.end();
			});
		break;
		case 'searchYoutube':
			searchYoutube(req, function (error, data) {
				if(error) {
					res.json({message: error}, 500);
				}
				res.json(data);
			});
		break;
		case 'getCards':
			getCards(req, function (error, data) {
				if(error) {
					res.json({message: error}, 500);
				}
				res.json({data: data});
			});
		break;
	}
};
/**
 * Searches youtube given the query as the input parameter from the POST request
 * @param  {Object}   req      The request from the user
 * @param  {Function} callback Callback function to send back
 * @return {Function} callback ^
 */
function searchYoutube(req, callback) {
	Youtube.authenticate({
		type: "oauth",
		token: config.oauth
	});
	Youtube.search.list({q: req.body.q, part: 'snippet', maxResults: 50}, function (error, result) {
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
			return callback(null, result.items);
		});
	});
}

function getCards(req, callback) {
	var cardAmount = parseInt(req.body.cardAmount);
	fs.readFile('apps/youtube/views/card.jade', 'utf8', function (error, data) {
		if(error) {
			return callback('Error reading template file');
		}
		var fn = jade.compile(data);
		var html = fn();
		var totalHtml = "";
		while(cardAmount !== 0) {
			totalHtml += html;
			cardAmount--;
		}
		return callback(null, totalHtml);
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

function getDuration(iso8601Duration) {
	var durationInSeconds = iso8601.parseToTotalSeconds(iso8601Duration);
	return Math.floor(durationInSeconds/60) + ':' + ('0' + durationInSeconds%60).slice(-2);
}

