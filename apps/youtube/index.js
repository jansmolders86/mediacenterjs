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
var Youtube = require('youtube-api');
var config = require('../../configuration/config.json');
exports.index = function(req, res, next){
	Youtube.authenticate({
		type: "oauth",
		token: config.oauth
	});
	// TODO Currently uses most popular videos to display because getting personal activity feed has no view counts
	Youtube.videos.list({"part": "snippet,statistics", "chart": "mostPopular", "maxResults": 50}, function (error, activityData) {
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
				"createdDate": dateString
			};
			videos.push(videoObj);
		}
		res.render('videos', {"videos": videos});
	});
};
/*http://stackoverflow.com/a/8363049/1612721*/
function createDateString(createdDate) {
	return createdDate.getUTCFullYear() +"/"+
	("0" + (createdDate.getUTCMonth()+1)).slice(-2) +"/"+
	("0" + createdDate.getUTCDate()).slice(-2) + " " +
	("0" + createdDate.getUTCHours()).slice(-2) + ":" +
	("0" + createdDate.getUTCMinutes()).slice(-2) + ":" +
	("0" + createdDate.getUTCSeconds()).slice(-2) + " UTC";
}

