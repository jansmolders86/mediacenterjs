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
var fs = require ('fs');
var ajax_utils = require('../../lib/utils/ajax-utils');
var logger = require('winston');

exports.checkVersion = function(req, res) {
    var url = 'https://raw.github.com/jansmolders86/mediacenterjs/master/package.json';
    ajax_utils.xhrCall(url, function(response) {
        var obj = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        var remote = JSON.parse(response);
        if(remote.version > obj.version){
            logger.info('New version '+remote.version+' Available');
            res.json({version: remote.version})
        } else{
            logger.info('Current version up to date.');
           res.status(200).send();
        }
    });
}
