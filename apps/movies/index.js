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
, functions = require('./movie-functions');

exports.index = function(req, res){

    DeviceInfo.isDeviceAllowed(req, function(allowed){
        res.render('movies', {
            title: 'Movies',
            selectedTheme: config.theme,
            allowed: allowed
        });
    });

};

exports.get = function(req, res){
	var infoRequest = req.params.id,
		optionalParam = req.params.optionalParam,
        serveToFrontEnd = null
	
	if(infoRequest === 'filter') {
		functions.filter(req, res, optionalParam);
	}
	else if (!optionalParam) {
		switch(infoRequest) {
			case('getGenres'):
				functions.getGenres(req, res);
				break;
			case('loadItems'):
                serveToFrontEnd = true;
                functions.loadItems(req, res, serveToFrontEnd);
				break;
            case('backdrops'):
                functions.backdrops(req, res);
                break;
		}	
	}

    if(optionalParam === 'play'){
        var movieTitle = infoRequest.replace(/\+/g, " ");
        functions.playMovie(req, res, movieTitle);
    }
};


exports.post = function(req, res){
    if(req.params.id === 'sendState'){
        functions.sendState(req, res);
    }
}
