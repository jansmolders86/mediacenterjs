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
var metafetcher = require('../music/music-metadata')
  , music_playback_handler = require('./music-playback-handler')
  , async = require('async')
  , dbschema = require('../../lib/utils/database-schema')
  , Album = dbschema.Album
  , Artist = dbschema.Artist
  , Track = dbschema.Track;

exports.loadItems = function (req, res, serveToFrontEnd) {
    function getAlbums(noalbumsCallback) {
        Album.findAll({include: [Track, Artist]})
        .error(function (err) {
            res.status(500).send();
        })
        .success(function (albums) {
            if (albums === null || albums.length === 0) {
                noalbumsCallback();
            } else {
                if (serveToFrontEnd) {
                    res.json(albums);
                }
            }
        })
    }
    getAlbums(function () {
        metafetcher.loadData(function () {
            getAlbums(function () {
                res.status(500).send();
            });
        });
    });
}

exports.playTrack = function(req, res, trackid){
    music_playback_handler.startTrackPlayback(res, trackid);
};

exports.edit = function(req, res, data){
    Album.find(data.id)
    .success(function(album) {
        album.updateAttributes(data)
        .success(function () {res.status(200).send();})
        .error(function(err) {res.status(500).send();});
    });
}
