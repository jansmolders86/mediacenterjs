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

var colors = require('colors')
, fs = require('fs-extra')
, path = require('path')
, config = require('../../lib/handlers/configuration-handler').getConfiguration()
, logger = require('winston')
, transcoder = require('../transcoding')
, isThere = require('is-there')
, fileUtils = require('../utils/file-utils')
;

/**
 * Starts video streaming for the specified file.
 * @param response          The response to write the video stream to
 * @param url               The URL to the file
 * @param file              The File
 * @param subtitleUrl       The URL to the subtitle file
 * @param subtitleTitle     The filename ofthe subtitle file
 * @param type              The type for which the playback needs to be started (eg, tv or movie)
 */
exports.startPlayback = function(response, platform, mediaObject, type) {
    if (!mediaObject.filePath) {
      logger.error('File '+ url + ' not found, did you move or delete it?', err);
      return response.status(404).send();
    }

    var fileUrl      = mediaObject.filePath;
    var fileDir      = path.dirname(fileUrl);
    var fileName     = path.basename(fileUrl);
    var fileExt      = path.extname(fileUrl);
    var fileBaseName = path.basename(fileUrl, fileExt);

    var subtitleTitle = fileBaseName + '.srt';

    var filetype = fileName.match(/[^.]+$/);
    filetype = filetype ? filetype.toString() : '';

    var normalizedFilename = fileBaseName.replace(/ /g, '-') + '.mp4';
    var dataDir = './public/data/' + type;
    var outputPath = path.join(dataDir, normalizedFilename);
    var hasSub = false;

    // Ensure Data-Directory exists
    fs.mkdirpSync(dataDir);

    // Check if subtitles exist and copy them to data folder
    var files = fs.readdirSync(fileDir);
    files.forEach(function(file) {
        // search for "my_movie_file.srt" or "my_movie_file.it.srt" (XBMC downloads subtitles with the language code)
        if (file.indexOf(fileBaseName) === 0 && file.match(/\.srt$/i)) {
            var subtitleUrl = path.join(fileDir, file);
            var subOutput = path.join(dataDir, subtitleTitle);
            fs.copySync(subtitleUrl, subOutput);
            hasSub = true;
            // break the loop
            return false;
        }
    });

    checkProgression(mediaObject.id, type, function(data) {
        if(data.transcodingstatus === 'pending' || data.transcodingstatus === undefined) {
            if (isThere.sync(outputPath) && !transcoder.CurrentTranscodings.isTranscoding(fileUrl)) {
                fs.unlinkSync(outputPath);
            }

            if (filetype === 'mp4') {
                logger.info('File is mp4, copieing local file to data folder so it can be accessed...');
                fs.copySync(fileUrl, outputPath);
            } else {
                logger.warn('Previously transcoding of this file was not completed!');
                transcoder.start(mediaObject.id, type, response, fileUrl, platform, fileName, outputPath);
            }
        } else {
            logger.info('File ' + file + ' already trancoded with quality level: ' + config.quality + '. Continuing with playback...');
        }

        if (platform === 'desktop') {
            getDuration(response, fileUrl, fileName, mediaObject, type, function (duration) {
                var webFriendlyOutputPath = outputPath.substr(6);
                var fileInfo = {
                    'outputPath'    : webFriendlyOutputPath,
                    'fileName'      : fileName,
                    'duration'      : duration,
                    'progression'   : data.progression,
                    'subtitle'      : hasSub
                }

                response.json(fileInfo);
            });
        }
    });
};

/* Private Methods */

var getDuration = function (response, url, file, mediaObject, type, callback) {
    var probe = require('node-ffprobe');
    probe(url, function (err, probeData) {
        if (err) {
            logger.warn('Using fallback length due to error:', err);
            return callback(9000);
        }

        if (probeData && probeData.streams[0].duration && probeData.streams[0].duration !== 'N/A' && probeData.streams[0].duration > 0) {
            logger.info('Found duration "' + probeData.streams[0].duration + '" in metadata, continuing...');
            callback(probeData.streams[0].duration);
        } else if (type === 'Movie') {
            logger.info('Falling back to database runtime information');
            callback(mediaObject.runtime || 9000);
        }
    });
};

var checkProgression = function(mediaID, type, callback) {
    var findData = {};
    findData[type + 'Id'] = mediaID;

    var empty = {
        progression: 0,
        transcodingstatus: 'pending'
    };

    ProgressionMarker.find({ where: findData }).then(function (marker) {
        if (!marker) {
            callback(empty);
            return;
        }

        callback({
            progression: marker.progression,
            transcodingstatus: marker.transcodingStatus
        });
    }).error(function (err) {
        if (err) {
            logger.error('Could not load progression marker for ' + type + ' and ID: ' + mediaID, err);
        }

        callback(empty);
    });
};
