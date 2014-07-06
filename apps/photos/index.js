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
, functions = require('./photos-functions');

exports.index = function(req, res){
    res.render('photos');
};

exports.get = function(req, res){
    var infoRequest = req.params.id;
    if (infoRequest === 'loadItems') {
        return functions.loadItems(req, res);
    } else if (infoRequest === 'show') {
        return functions.show(req, res);
    }
};


exports.post = function(req, res){
    // TODO
}
