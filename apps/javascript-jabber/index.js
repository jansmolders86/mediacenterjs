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
exports.index = function(req, res, next){

var FeedParser = require('feedparser')
, request = require('request')
, fs = require('fs.extra')
, allArticles = new Array();

request('http://feeds.feedburner.com/JavascriptJabber')
	.pipe(new FeedParser())
	.on('error', function(error) {
		console.error('Error parsing feed',error);
	})
	.on('article', function (article) {
		var enclosureLink = article.enclosures[0].url

		var title = '<h1>'+article.title+'</h1>' 
		var description  = '<p>' + article.description.replace(/&#8211;/g, '<br />') + '</p>'; 
		var link  = '<a href="'+enclosureLink+'" class="link">Listen</a>'

		allArticles.push([title , description , link]);
	
	})
	.on('end', function () {
		res.render('javascript-jabber', { articles : allArticles });
	});
	
};



