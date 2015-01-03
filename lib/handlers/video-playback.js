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
, fileUtils = require('../utils/file-utils');

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
    var dir = path.resolve(config[type === 'Movie' ? 'moviepath' : 'tvpath']);
    fileUtils.getLocalFile(dir, mediaObject.fileName, function (err, file) {
        if (err) {
          logger.error('File '+ url + ' not found, did you move or delete it?', err);
          return response.status(404).send();
        }

        var fileUrl = file.href;

        var subtitleUrl = fileUrl;
        subtitleUrl     = subtitleUrl.split(".");
        subtitleUrl     = subtitleUrl[0]+".srt";

        var subtitleTitle   = mediaObject.fileName;
        subtitleTitle       = subtitleTitle.split(".");
        subtitleTitle       = subtitleTitle[0]+".srt";

        // TODO: Cleanup:
        var filetype = file.file.match(/[^.]+$/);
        filetype = filetype ? filetype.toString() : '';

        var normalizedFilename = file.file.replace(/\.[^.]*$/, '.mp4').replace(/ /g, '-');
        var dataDir = './public/data/' + type;
        var outputPath = path.join(dataDir, normalizedFilename);
        var hasSub = false;

        // Ensure Data-Directory exists
        fs.mkdirpSync(dataDir);

        // Check if subtitles exist and copy them to data folder
        if (fs.existsSync(subtitleUrl)) {
            var subOutput = path.join(dataDir, subtitleTitle);
            fs.copySync(subtitleUrl, subOutput);
            hasSub = true;
        }

        checkProgression(mediaObject.id, type, function(data) {
            if(data.transcodingstatus === 'pending' || data.transcodingstatus === undefined) {
                if (fs.existsSync(outputPath) && !transcoder.CurrentTranscodings.isTranscoding(fileUrl)) {
                    fs.unlinkSync(outputPath);
                }

                if (filetype === 'mp4') {
                    logger.info('File is mp4, copieing local file to data folder so it can be accessed...');
                    fs.copySync(fileUrl, outputPath);
                } else {
                    logger.warn('Previously transcoding of this file was not completed!');
                    transcoder.start(mediaID, type, response, fileUrl, platform, file.file, outputPath);
                }
            } else {
                logger.info('File ' + file + ' already trancoded with quality level: ' + config.quality + '. Continuing with playback...');
            }

            if (platform === 'desktop') {
                getDuration(response, fileUrl, file.file, mediaObject.id, type, function (duration) {
                    var webFriendlyOutputPath = outputPath.substr(6);
                    var fileInfo = {
                        'outputPath'    : webFriendlyOutputPath,
                        'duration'      : duration,
                        'progression'   : data.progression,
                        'subtitle'      : hasSub
                    }

                    response.json(fileInfo);
                });
            }
        });
    });
};

/* Private Methods */

var getDuration = function (response, url, file, mediaID, type, callback) {
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

            Movie.find(mediaID).success(function (movie) {
                callback(movie.runtime);
            }).error(function (err) {
                logger.error('Could not load runtime of movie ' + mediaID + '! Falling back to runtime 9000...', err);
                callback(9000);
            });
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

    ProgressionMarker.find({ where: findData }).success(function (marker) {
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
