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
var logger = require('winston');
/**
 Makes an AJAX-Call.
 @param url             URL to call
 @param callback        Callback function
 */
exports.xhrCall = function (url, callback) {
    var request = require("request");

    request({
        url: url,
        headers: { "Accept": "application/json" },
        method: "GET"
    }, function (error, response, body) {
        if(!error) {
            callback(body);
        } else {
            logger.error('Helper: XHR Error', {error:error});
        }
    });
};

/**
 Writes data to a JSON file and then returns the contents to the client.
 @param writePath         Path to store file
 @param dataToWrite        Data to write to file
 @param callback        The Callback (returns the contents as string)
 */
exports.writeToFile = function (writePath, dataToWrite, callback){
    var fs = require('fs-extra');

    fs.writeFile(writePath, dataToWrite, function(writeErr) {
        if (!writeErr) {
            fs.readFile(writePath, 'utf8', function (readErr, data) {
                if(!readErr){
                    callback(data);
                }else{
                    logger.error('Cannot read data', {error: readErr});
                }
            });
        } else {
            logger.error('Error getting data', {error: writeErr});
        }
    });
};
