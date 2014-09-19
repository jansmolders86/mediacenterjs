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

exports.loadItems = function (req, res, serveToFrontEnd){
    Show.findAll({include:[Episode]})
    .success(function (shows) {
        if (shows === null || shows.length === 0) {
            metafetcher.loadData(req, res, true);
        } else {
            if(serveToFrontEnd === true){
                res.json(shows);
            }
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

exports.playFile = function (req, res, platform, episodeId){
    Episode.find(episodeId)
    .success(function (episode) {
        file_utils.getLocalFile(config.tvpath, episode.fileName, function(err, file) {
            if (err){
                console.log(err .red);
            }
            if (file) {
                var tvShowUrl = file.href;

                var subtitleUrl = tvShowUrl;
                subtitleUrl     = subtitleUrl.split(".");
                subtitleUrl     = subtitleUrl[0]+".srt";

                var subtitleTitle   = episode.fileName;
                subtitleTitle       = subtitleTitle.split(".");
                subtitleTitle       = subtitleTitle[0]+".srt";

                var type = "tv";
                playback_handler.startPlayback(res, platform, episode.id, tvShowUrl, episode.fileName, subtitleUrl, subtitleTitle, type);

            } else {
                console.log("File " + episode.fileName + " could not be found!" .red);
            }
        });
    });
};

exports.progress = function (req, res){

    var data = req.body;
    ProgressionMarker.findOrCreate({EpisodeId : data.id},
        {EpisodeId: data.id})
    .success(function (progressionmarker) {
        progressionmarker.updateAttributes({
            progression         : data.progression,
            transcodingStatus   : 'pending'
        })
        .success(function() {
            res.status(200).send();
        })
        .error(function(err) {
            res.status(500).send();
        });
    })
    .error(function(err) {
        res.status(500).send();
    });
};


/** Private functions **/

fetchTVData = function(req, res, serveToFrontEnd) {
    metafetcher.loadData(req, res, serveToFrontEnd);
}


