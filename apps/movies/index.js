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

exports.engine = 'jade';

/* Modules */
var express = require('express')
, app = express()
, config = require('../../lib/handlers/configuration-handler').getConfiguration()
, deviceInfo = require('../../lib/utils/device-utils')
, MediaHandler = require('../../lib/media-handler')
, logger = require('winston');

var MovieHandler = new MediaHandler('Movie', 'Movie', require('./metadata-processor'), 'moviepath');

exports.index = function(req, res){
    deviceInfo.isDeviceAllowed(req, function(allowed){
        res.render('movies', {
            title: 'Movies',
            selectedTheme: config.theme,
            allowed: allowed
        });
    });
};

exports.get = function(req, res, next){
    var infoRequest = req.params.id,
        optionalParam = req.params.optionalParam,
        platform = req.params.action;

    if (infoRequest === 'load') {
        MovieHandler.load({}, handleCallback(res));
    } else if (optionalParam === 'play') {
        MovieHandler.playFile(res, platform, infoRequest);
    } else if (optionalParam === 'stop') {
        MovieHandler.stopTranscoding(handleCallback(res));
    } else {
        next();
    }
};


exports.post = function(req, res, next){
    var data = req.body;
    if(req.params.id === 'progress'){
        MovieHandler.savePlaybackProgress(data.id, data.progression, handleCallback(res));
    } else if(req.params.id === 'edit'){
        MovieHandler.editMetadata(data.id, data, handleCallback(res));
    } else if(req.params.id === 'update'){
        MovieHandler.updateMetadata(data.id, data, handleCallback(res));
    } else {
        next();
    }
};

function handleCallback(res) {
    return function (err, results) {
        if (err) {
            logger.error(err);
            return res.status(500).send();
        }

        if (results) {
            return res.json(results);
        }

        return res.status(200).send();
    }
}
