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
, fs = require('fs.extra')
, helper = require('../../lib/helpers.js')
, config = require('../../lib/handlers/configuration-handler').getConfiguration()
, deviceInfo = require('../../lib/utils/device-utils')
, functions = require('./tv-functions');

exports.index = function(req, res){
    deviceInfo.isDeviceAllowed(req, function(allowed){
        res.render('tvshows', {
            title: 'tvshows',
            selectedTheme: config.theme,
            allowed: allowed
        });
    });
};

exports.get = function(req, res, next){
    var infoRequest = req.params.id,
        optionalParam = req.params.optionalParam,
        platform = req.params.action,
        serveToFrontEnd = null

    if (!optionalParam) {
        if(infoRequest === 'load') {
            serveToFrontEnd = true;
            functions.loadItems(req, res, serveToFrontEnd);
        } else {
            next();
        }
    }

    if(platform !== undefined && optionalParam === 'play'){
        var title = infoRequest.replace(/\+/g, " ");
        switch(platform) {
            case('desktop'):
                functions.playFile(req, res, platform, title);
                break;
            case('ios'):
                functions.playFile(req, res, platform, title);
                break;
            case('android'):
                functions.playFile(req, res, platform, title);
                break;
            default:
                next();
        }
    }

};

exports.post = function(req, res, next){
    var data = req.body;
    if(req.params.id === 'progress'){
        functions.progress(req, res);
    }
    else if(req.params.id === 'edit'){
        functions.edit(req, res, data);
    } else {
        next();
    }
}
