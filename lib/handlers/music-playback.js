/*
  MediaCenterJS - A NodeJS based mediacenter solution

    Copyright (C) 2014 - Jan Smolders

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
/* Global imports */
var colors = require('colors'),
  fs = require('fs-extra'),
  config = require('../../lib/handlers/configuration-handler').getConfiguration();

/* Public Methods */
/**
 * Starts the playback of the provided track.
 * @param response              The HTTP-Response
 * @param albumTitle            The album title
 * @param trackName             The name of the track
 */
exports.startPlayback = function(response, platform, mediaObject, type) {
    var url = mediaObject.filePath;
    if (fs.existsSync(url)) {
        startTrackStreaming(response, url);
    } else {
        console.error('Could not find file ' + url);
    }
};

/* Private Methods */

var startTrackStreaming = function(response, playbackPath) {
  var fileStat = fs.statSync(playbackPath),
    start = 0,
    end = fileStat.size - 1;

  console.log('Playing track:', playbackPath .green);

  response.writeHead(200, {
    'Connection': 'close',
    'Content-Type': 'audio/mp3',
    'Content-Length': end - start,
    'Content-Range': 'bytes ' + start + '-' + end + '/' + fileStat.size
  });

  var stream = fs.createReadStream(playbackPath);
  stream.pipe(response);
};
