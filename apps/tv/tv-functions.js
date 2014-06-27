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
    , config = require('../../lib/handlers/configuration-handler').getConfiguration();

    var database = require('../../lib/utils/database-connection');
    var db = database.db;

var getNewFiles = false;

//Create tables
db.query("CREATE TABLE IF NOT EXISTS tvshows (title VARCHAR PRIMARY KEY,banner VARCHAR, genre VARCHAR, certification VARCHAR)");
db.query("CREATE TABLE IF NOT EXISTS tvepisodes (localName TEXT PRIMARY KEY,title VARCHAR, season INTEGER, epsiode INTEGER)");

exports.loadItems = function (req, res, serveToFrontEnd){
    if(serveToFrontEnd == false){
        fetchTVData(req, res, serveToFrontEnd);
    } else if(serveToFrontEnd === undefined || serveToFrontEnd === null){
        var serveToFrontEnd = true;
        getTvshows(req, res, serveToFrontEnd);
    }  else{
        getTvshows(req, res, serveToFrontEnd);
    }
};

exports.edit = function(req, res, data){
    db.query('UPDATE tvshows SET title=$newTitle,banner=$newBanner WHERE title=$currentTitle; ', {
        newTitle      : data.newTitle,
        newBanner     : data.newBanner,
        currentTitle  : data.currentTitle
    },
    function (err, rows) {
        if(err){
            console.log('DB error', err);
        } else {
            res.json('done');
        }
    });
}

exports.playEpisode = function (req, res, tvShowRequest){
    file_utils.getLocalFile(config.tvpath, tvShowRequest, function(err, file) {
        if (err) console.log(err .red);
        if (file) {
            var tvShowUrl = file.href
            , tvShow_playback_handler = require('./tv-playback-handler');

            var subtitleUrl = tvShowUrl;
            subtitleUrl     = subtitleUrl.split(".");
            subtitleUrl     = subtitleUrl[0]+".srt";

            var subtitleTitle   = tvShowRequest;
            subtitleTitle       = subtitleTitle.split(".");
            subtitleTitle       = subtitleTitle[0]+".srt";

            tvShow_playback_handler.startPlayback(res, tvShowUrl, tvShowRequest, subtitleUrl, subtitleTitle);

        } else {
            console.log("File " + tvShowRequest + " could not be found!" .red);
        }
    });
};

exports.sendState = function (req, res){
    db.query("CREATE TABLE IF NOT EXISTS progressionmarker (title TEXT PRIMARY KEY, progression TEXT, transcodingstatus TEXT)");

    var incommingData = req.body
    , tvShowTitle = incommingData.tvShowTitle
    , progression = incommingData.currentTime
    , transcodingstatus = 'pending';

    if(tvShowTitle !== undefined && progression !== undefined){
        var progressionData = [tvShowTitle, progression, transcodingstatus];
        db.query('INSERT OR REPLACE INTO progressionmarker VALUES(?,?,?)',progressionData );
    }
};


/** Private functions **/

fetchTVData = function(req, res, serveToFrontEnd) {
    metafetcher.loadData(req, res, serveToFrontEnd);
}

function getTvshows(req, res, serveToFrontEnd){
    var itemsDone   = 0;
    var ShowList    = [];

    db.query('SELECT * FROM tvshows',{
        title             : String,
        banner            : String,
        genre             : String,
        certification      : String
    }, function(err, rows) {
        if(err){
            db.query("CREATE TABLE IF NOT EXISTS tvshows (title VARCHAR PRIMARY KEY,banner VARCHAR, genre VARCHAR, certification VARCHAR)");
            console.log("DB error",err);
            serveToFrontEnd = true;
            fetchTVData(req, res, serveToFrontEnd);
        } else if (rows !== null && rows !== undefined && rows.length > 0) {
            var count = rows.length;
            console.log('Found '+count+' shows, getting additional data...');

            rows.forEach(function(item, value){
                var showTitle       = item.title
                , showBanner        = item.banner
                , showGenre         = item.genre
                , showCertification = item.certification;

                getEpisodes(showTitle, showBanner, showGenre, showCertification, function(availableEpisodes){
                    if(availableEpisodes !== 'none'){
                        if(availableEpisodes !== null) {
                            ShowList.push(availableEpisodes);
                            itemsDone++;

                            if (count === itemsDone && serveToFrontEnd === true) {
                                console.log('Done...');
                                res.json(ShowList);
                            }
                        }
                    } else {
                        console.log('Error retrieving episodes');
                    }
                });
            });
        } else {
            fetchTVData(req, res, serveToFrontEnd);
        }
    });
}

function getEpisodes(showTitle, showBanner, showGenre, showCertification, callback){
    db.query('SELECT * FROM tvepisodes WHERE title = $title ORDER BY season asc', { title:showTitle }, {
            localName   : String,
            title          : String,
            season        : Number,
            episode      : Number
        },
        function(err, rows) {
            if(err){
                db.query("CREATE TABLE IF NOT EXISTS tvepisodes (localName TEXT PRIMARY KEY,title VARCHAR, season INTEGER, epsiode INTEGER)");
                callback('none');
            }
            if (typeof rows !== 'undefined' && rows.length > 0){
                var episodes = rows;
                var availableEpisodes = {
                    "title"         : showTitle,
                    "banner"        : showBanner,
                    "genre"         : showGenre,
                    "certification" : showCertification,
                    "episodes"      : episodes
                }
                callback(availableEpisodes);

            } else {
                callback('none');
            }
        }
    );
}
