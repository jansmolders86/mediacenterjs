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

/*
// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
exports.engine = 'jade';
var GoogleMusic = require('googlemusicapi').GoogleMusicApi;
var googlemusic = new GoogleMusic('jansmolders86@gmail.com', '');
// Render the indexpage
exports.index = function(req, res, next){
 googlemusic.Login(function () {
        googlemusic.GetAllSongs('', function(result) {
            var length = result.length;
            var i;
            for (i=0 ; i<length ; i++) {
                console.log(result[i].title); // get title of all songs
            }
        });
        googlemusic.GetPlaylist('All', function(result) {
            var length = result.length;
            var i;
            for (i=0 ; i<length ; i++) {
                console.log(result[i].playListId); // get id of all playlists
            }
        });
    });
	res.render('gmusic');
	
};
*/
