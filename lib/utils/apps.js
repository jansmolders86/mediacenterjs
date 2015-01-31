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
var fs = require('fs-extra')
    , configuration_handler = require('../handlers/configuration-handler');
var config = configuration_handler.initializeConfiguration();
var path = require('path');

exports.getApps = function () {
    var apps = [];

    // Search core app folder for apps and check if tile icon is present
    fs.readdirSync('./apps').forEach(function (name) {
        if ((name === 'movies' && config.moviepath === "")
            || (name === 'music' && config.musicpath === "")
            || (name === 'tv' && config.tvpath === "")) {
            return;
        }

        addApp('./public/' + name, name, apps);
    });

    // Search node_modules for plugins
    var nodeModules = './node_modules';
    var pluginPrefix = config.pluginPrefix;
    fs.readdirSync(nodeModules).forEach(function (name) {
        // Check if the folder in the node_modules starts with the prefix
        if (name.substr(0, pluginPrefix.length) !== pluginPrefix) {
            return;
        }

        var pluginPath = path.join(nodeModules, name, 'public');
        addApp(pluginPath, name, apps);
    });

    apps.push({
        appLink: "remote",
        appName: "remote",
        tileLink: '',
        tileCSS: ''
    });

    return apps;
};

function addApp(apppath, appname, array) {
    var tileImgSVGPath = path.join(apppath, 'tile.svg');
    var tileImgPNGPath = path.join(apppath, 'tile.png');
    var tileImgCSSPath = path.join(apppath, 'tile.css');

    // Search for a SVG or PNG tile
    var tileImg = '';
    if (fs.existsSync(tileImgSVGPath)) {
        tileImg = tileImgSVGPath;
    } else if (fs.existsSync(tileImgPNGPath)) {
        tileImg = tileImgPNGPath;
    }

    var tileCSS = '';
    if (fs.existsSync(tileImgCSSPath)) {
        tileCSS = tileImgCSSPath;
    }

    // Remove first part of the path (./public or ./node_modules)
    tileImg = tileImg.split(path.sep).slice(1).join(path.sep);
    tileCSS = tileCSS.split(path.sep).slice(1).join(path.sep);
    if (tileImg !== '') {
        array.push({
            appLink: appname,
            appName: appname.replace(config.pluginPrefix, ''),
            tileLink: tileImg,
            tileCSS: tileCSS
        });
    }
}
