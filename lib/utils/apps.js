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
var fs = require('fs')
    , configuration_handler = require('../handlers/configuration-handler');
var config = configuration_handler.initializeConfiguration();

exports.getApps = function () {
    var apps = [];

    //Search core app folder for apps and check if tile icon is present
    fs.readdirSync('./apps').forEach(function (name) {

        // Search for a SVG or PNG tile
        var tileImg = '';
        if (fs.existsSync('./public/' + name + '/tile.svg')) {
            tileImg = '/' + name + '/tile.svg';
        } else if (fs.existsSync('./public/' + name + '/tile.png')) {
            tileImg = '/' + name + '/tile.png';
        }
        var tileCSS = '';
        if (fs.existsSync('./public/' + name + '/tile.css')) {
            tileCSS = '/' + name + '/tile.css';
        }

        if (!(name === 'movies' && config.moviepath === ""
            || name === 'music' && config.musicpath === ""
            || name === 'tv' && config.tvpath === ""
            || tileImg === '')) {
            apps.push({
                appLink: name,
                appName: name,
                tileLink: tileImg,
                tileCSS: tileCSS
            });
        }
    });

    //search node_modules for plugins
    var nodeModules = './node_modules';
    var pluginPrefix = config.pluginPrefix;

    fs.readdirSync(nodeModules).forEach(function (name) {

        //Check if the folder in the node_modules starts with the prefix
        if (name.substr(0, pluginPrefix.length) !== pluginPrefix) {
            return;
        }

        var pluginPath = nodeModules + '/' + name;

        // Search for a SVG or PNG tile
        var tileImg = '';
        if (fs.existsSync(pluginPath + '/public/tile.svg')) {
            tileImg = '/' + name + '/public/tile.svg';
        } else if (fs.existsSync(pluginPath + '/public/tile.png')) {
            tileImg = '/' + name + '/public/tile.png';
        }

        // Search for custom tile css
        var tileCSS = '';
        if (fs.existsSync(pluginPath + '/public/tile.css')) {
            tileCSS = '/' + name + '/public/tile.css';
        }

        var appName = name.replace('mediacenterjs-', '');

        if (tileImg !== '') {
            apps.push({
                appLink: name,
                appName: appName,
                tileLink: tileImg,
                tileCSS: tileCSS
            });
        }

    });
    return apps;
};