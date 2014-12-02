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
var fs  = require('fs.extra')
var logger = require('winston');

var path = require('path');
var appDir = path.dirname(require.main.filename)


if(fs.existsSync(appDir + "/log/") === false){
    fs.mkdirSync(appDir + "/log/");
    fs.openSync(appDir + "/log/system.log", 'w');
    fs.chmodSync(appDir + "/log/system.log", 0755);
}

logger.setLevels({
    debug:0,
    info: 1,
    silly:2,
    warn: 3,
    error:4,
});
logger.addColors({
    debug: 'green',
    info:  'cyan',
    silly: 'magenta',
    warn:  'yellow',
    error: 'red'
});

logger.remove(logger.transports.Console);
logger.add(logger.transports.File, { filename:appDir + "/log/system.log"});
logger.add(logger.transports.Console, { level: 'debug', colorize:true });

module.exports = logger;
