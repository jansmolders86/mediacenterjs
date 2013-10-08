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
	Youtube.activities.list({"part": "snippet", "home": true}, function (error, activityData) {
		if( error instanceof Error ) {
			console.log('Error searching Youtube', error);
			res.render('youtube', {"error":'Problem getting content from YouTube.'});
			return;
		}
		var createdDate = new Date(activityData.items[0].snippet.publishedAt);
		var dateString = createdDate.getUTCFullYear() +"/"+
		("0" + (createdDate.getUTCMonth()+1)).slice(-2) +"/"+
		("0" + createdDate.getUTCDate()).slice(-2) + " " +
		("0" + createdDate.getUTCHours()).slice(-2) + ":" +
		("0" + createdDate.getUTCMinutes()).slice(-2) + ":" +
		("0" + createdDate.getUTCSeconds()).slice(-2);
		res.render('youtube', {
			"title": activityData.items[0].snippet.title, 
			"synopsis": activityData.items[0].snippet.description, 
			"image": activityData.items[0].snippet.thumbnails.high.url, 
			"channelTitle": activityData.items[0].snippet.channelTitle,
			"createdDate": dateString || Date.now(),
		});
		/*for(var videoCounter in activityData.items) {
			var videoObj = {

			}
		}*/
	});
};

