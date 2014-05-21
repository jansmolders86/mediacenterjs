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
    , rule                      = new schedule.RecurrenceRule();

    console.log('Scheduled task set for:', config.schedule);    
    
    var ruleSchedule = config.schedule.split(":");
    rule.hour        = parseInt(ruleSchedule[0]);
    rule.minute      = parseInt(ruleSchedule[1]);

    var j = schedule.scheduleJob(rule, function(){
        if(fs.existsSync('../lib/database/mcjs-sqlite-journal') === false){
            
            console.log('Running scheduled task...');
            
            var moviesfunctions = require('../../apps/movies/movie-functions')
            , musicfunctions = require('../../apps/music/music-functions')
            , tvfunctions = require('../../apps/tv/tv-functions')
            , serveToFrontEnd = false
            , req // Dummy variable
            , res; // Dummy variable

            // Movies
            moviesfunctions.loadItems(req, res, serveToFrontEnd);

            // Music
            setTimeout(function(){    
                musicfunctions.loadItems(req, res, serveToFrontEnd);
            },10000);

            // TV
            setTimeout(function(){    
                tvfunctions.loadItems(req, res, serveToFrontEnd);
            },20000);

        } 
    });
}