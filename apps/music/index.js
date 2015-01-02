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
, fs = require('fs.extra')
, helper = require('../../lib/helpers.js')
, config = require('../../lib/handlers/configuration-handler').getConfiguration()
, deviceInfo = require('../../lib/utils/device-utils')
, functions = require('./music-functions');

// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
exports.engine = 'jade';

exports.index = function(req, res, next){
    deviceInfo.isDeviceAllowed(req, function(allowed){
        res.render('music', {
            title: 'music',
            selectedTheme: config.theme,
            allowed: allowed
        });
    });
};

exports.get = function(req, res, next){
    var infoRequest = req.params.id
        , optionalParam = req.params.optionalParam
        , action = req.params.action
        , serveToFrontEnd = null;

    var handled = false;
    if (infoRequest == 'load'){
        serveToFrontEnd = true;
        functions.loadItems(req,res, serveToFrontEnd);
        handled = true;
    }

    if(action){
        var trackid = optionalParam.replace(/\+/g, " ");
        switch(action) {
            case('play'):
                functions.playTrack(req, res, trackid);
                handled = true;
            break;
            case('next'):
                functions.nextTrack(req, res, trackid);
                handled = true;
            break;
            case('random'):
                functions.randomTrack(req, res, trackid);
                handled = true;
            break;
        }
    }
    if (!handled) {
        next();
    }
}

exports.post = function(req, res, next){
    var data = req.body;
    if(req.params.id === 'edit'){
        functions.edit(req, res, data);
    } else {
        next();
    }
}
