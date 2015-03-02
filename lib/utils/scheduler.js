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

exports.schedule = function() {

    var configuration_handler   = require('../handlers/configuration-handler')
    , config                    = configuration_handler.initializeConfiguration()
    , schedule                  = require('node-schedule')
    , fs                        = require ('fs')
    , rule                      = new schedule.RecurrenceRule()
    , _                         = require('underscore')
    , fileUtils                 = require('../utils/file-utils')
    , isThere                   = require('is-there')
    , logger = require('winston');


    if (config.schedule) {
        logger.info('Scheduled task set for:', config.schedule);

        var ruleSchedule = config.schedule.split(":");
        rule.hour        = parseInt(ruleSchedule[0]);
        rule.minute      = parseInt(ruleSchedule[1]);

        var j = schedule.scheduleJob(rule, function() {
        if (isThere.sync('../lib/database/mcjs-sqlite-journal') === false) {
            logger.info('Running scheduled task...');

            var movie_metadata = require('../../apps/movies/metadata-processor');
            var tv_metadata = require('../../apps/tv/metadata-processor');
            var music_metadata = require('../../apps/music/metadata-processor');

            // Movies
            fileUtils.getLocalFiles(config.moviepath, movie_metadata.valid_filetypes, function (err, files) {
                _.each(files, function (file) { movie_metadata.processFile(file, function () {}); });
            });

            // Music
            setTimeout(function() {
                fileUtils.getLocalFiles(config.musicpath, music_metadata.valid_filetypes, function (err, files) {
                    _.each(files, function (file) { music_metadata.processFile(file, function () {}); });
                });
            }, 10000);

            // TV
            setTimeout(function() {
                fileUtils.getLocalFiles(config.tvpath, tv_metadata.valid_filetypes, function (err, files) {
                    _.each(files, function (file) { tv_metadata.processFile(file, function () {}); });
                });
            }, 20000);

        }
        });
    }
}
