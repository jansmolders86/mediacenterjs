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
, DeviceInfo = require('../../lib/utils/device-utils')
, functions = require('./tv-functions');

exports.index = function(req, res){
    DeviceInfo.isDeviceAllowed(req, function(allowed){
        res.render('tvshows', {
            title: 'tvshows',
            selectedTheme: config.theme,
            allowed: allowed
        });
    });
};

exports.get = function(req, res){
	var infoRequest = req.params.id,
		optionalParam = req.params.optionalParam,
		platform = req.params.action;

    if (!optionalParam) {
        if(infoRequest === 'loadItems') {
            functions.loadTvShow(req, res);
        }
	}

    if(optionalParam === 'play'){
        var episode = infoRequest.replace(/\+/g, " ");
        functions.playEpisode(req, res,episode);
    }
    
};


exports.post = function(req, res){
    var infoRequest = req.params.id;
    if(infoRequest === 'sendState'){
        functions.sendState(req, res);
    }
}
