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
    var appDir = path.dirname(require.main.filename)
        , fileLocation = path.join(__dirname, 'metadata', dataType+'-metadata.js')
		, dataType = dataType
        , exec = require('child_process').exec
        , child = exec('node "' + fileLocation + '"', { maxBuffer: 9000*1024 }, function(err, stdout, stderror) {
            if (err) {
                console.log('Metadata fetcher error: ',err) ;
            }
        });
		
    child.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    child.stderr.on('data', function(data) {
        console.log(data.toString());
    });

    child.on('exit', function() {
		console.log('Metadata fetching for '+dataType+ ' complete...')
        callback(dataType);
		console.log('Child process exited for: ', dataType);
    });
}
