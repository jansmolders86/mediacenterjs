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

/* Modules */
var express = require('express')
, app = express()
, config = require('../../lib/handlers/configuration-handler').getConfiguration()
, deviceInfo = require('../../lib/utils/device-utils')
, MediaHandler = require('../../lib/media-handler')
, Sequelize = require('sequelize');
var MusicHandler = new MediaHandler('Album', 'Track', require('./metadata-processor'), 'musicpath');

exports.engine = 'jade';

exports.index = function(req, res) {
    deviceInfo.isDeviceAllowed(req, function (allowed) {
        res.render('music', {
            title: 'music',
            selectedTheme: config.theme,
            allowed: allowed
        });
    });
};

exports.get = function(req, res, next) {
    var infoRequest = req.params.id
        , optionalParam = req.params.optionalParam
        , action = req.params.action;

    if (infoRequest === 'load') {
        MusicHandler.load({include: [Artist, Track]}, handleCallback(res));
    } else if (action) {
        var trackid = optionalParam.replace(/\+/g, ' ');
        switch(action) {
            case('play'):
                MusicHandler.playFile(res, undefined, trackid);
                break;
            case('next'):
                // TODO?: functions.nextTrack(req, res, trackid);
                break;
            case('random'):
                // TODO?: functions.randomTrack(req, res, trackid);
                break;
            default:
                next();
                break;
        }
    } else if (infoRequest === 'search') {
        MusicHandler.search(req, res, {
            include: [ Artist ],
            where : Sequelize.or({title: {like: '%' + req.query.q + '%'}}, {'Artist.name': {like: '%' + req.query.q + '%'}})
    });
    } else {
        next();
    }
};

exports.post = function(req, res, next) {
    if (req.params.id === 'edit') {
        MusicHandler.editMetadata(req.body.id, req.body, handleCallback(res));
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
