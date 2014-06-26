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
/**
 Get metadata for specific app
 @param dataType    String:     Name of meta data type. (eg. movie or tv)
 @param callback    function
 */

var path = require('path');

exports.fetch = function(req, res, dataType, callback) {
    var socket = require('./setup-socket');
    var io = socket.io;
    var ss;
    var spawn = require('child_process').spawn

    if(req !== undefined){
        req.setMaxListeners(0);
    }

    var appDir = path.dirname(require.main.filename)
        , fileLocation = path.join(__dirname, 'metadata', dataType+'-metadata.js')
        , dataType = dataType
        , metadataFetcher = spawn('node',[fileLocation]);

    metadataFetcher.stdout.on('data', function(data) {
        var value = data.toString();
        console.log(value);
    });

    metadataFetcher.stdout.on('end', function(data) {
        console.log('Spawned process ended');
    });

    metadataFetcher.on('exit', function() {
        console.log('Metadata fetching for '+dataType+ ' complete...')
        callback(dataType);
        console.log('Spawned process exited for: ', dataType);
    });

}

