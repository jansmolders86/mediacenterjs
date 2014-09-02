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
/* Global Imports */
var fs = require('fs.extra')
    , file_utils = require('../../lib/utils/file-utils')
    , colors = require('colors')
    , path = require('path')
    , metafetcher = require('../tv/tv-metadata')
    , config = require('../../lib/handlers/configuration-handler').getConfiguration()
    , playback_handler = require('../../lib/handlers/playback');

    var database = require('../../lib/utils/database-connection');
    var db = database.db;

var getNewFiles = false;


exports.loadItems = function (req, res, serveToFrontEnd){
    Show.findAll({include:[Episode]})
    .success(function (shows) {
        if (shows === null || shows.length === 0) {
            metafetcher.loadData(req, res, true);
        } else {
            res.json(shows);
        }
    })
    .error(function (err) {
        res.status(500).send();
    });
};

exports.edit = function(req, res, data){
    Show.find(data.id)
    .success(function(movie) {
        movie.updateAttributes(data)
        .success(function() {res.status(200).send();})
        .error(function(err) {res.status(500).send();});
    })
    .error(function(err) {res.status(404).send();});
}

exports.playFile = function (req, res, platform, tvShowRequest){
    file_utils.getLocalFile(config.tvpath, tvShowRequest, function(err, file) {
        if (err){
            console.log(err .red);
        }
        if (file) {
            var tvShowUrl = file.href;

            var subtitleUrl = tvShowUrl;
            subtitleUrl     = subtitleUrl.split(".");
            subtitleUrl     = subtitleUrl[0]+".srt";

            var subtitleTitle   = tvShowRequest;
            subtitleTitle       = subtitleTitle.split(".");
            subtitleTitle       = subtitleTitle[0]+".srt";

            var type = "tv";
            playback_handler.startPlayback(res, platform, tvShowUrl, tvShowRequest, subtitleUrl, subtitleTitle, type);

        } else {
            console.log("File " + tvShowRequest + " could not be found!" .red);
        }
    });
};

exports.progress = function (req, res){
    // db.query("CREATE TABLE IF NOT EXISTS progressionmarker (title TEXT PRIMARY KEY, progression INTEGER, transcodingstatus TEXT)");

    // var incommingData   = req.body
    // , tvShowTitle       = incommingData.title
    // , progression       = incommingData.progression
    // , transcodingstatus = 'pending';

    // if(tvShowTitle !== undefined && progression !== undefined){
    //     var progressionData = [tvShowTitle, progression, transcodingstatus];
    //     db.query('INSERT OR REPLACE INTO progressionmarker VALUES(?,?,?)',progressionData );
    // }
    res.status(500).send();
};


/** Private functions **/

fetchTVData = function(req, res, serveToFrontEnd) {
    metafetcher.loadData(req, res, serveToFrontEnd);
}


