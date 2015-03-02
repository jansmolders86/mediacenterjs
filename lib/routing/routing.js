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

var express = require('express')
  , static = require('serve-static')
  , fs = require('fs-extra')
  , isThere = require('is-there')
  , colors = require('colors')
  , ini = require('ini')
  , path = require('path')
  , configuration_handler = require('../handlers/configuration-handler')
  , logger = require('winston');

var config = configuration_handler.initializeConfiguration();
var parent, options;

var loadRoutes = function(_parent, _options) {
    var pluginPrefix = config.pluginPrefix;
    parent = _parent;
    options = _options;

    // read core plugin
    fs.readdirSync(__dirname + '/../../apps').forEach(function(name){
        // Ignore Dotfiles
        if (name.match(/^\.(.*)$/)) {
            return;
        }

        addRoute(name);
    });

    // read plugin install with npm
    fs.readdirSync(__dirname + '/../../node_modules').forEach(function(name){
        if(name.substr(0, pluginPrefix.length) !== pluginPrefix) {
            return;
        }

        addRoute(name, true);
    });
};

var addRoute = function(appName, isPlugin) {
    var verbose = options.verbose;
    var appDirectory = isPlugin ? 'node_modules' : 'apps';
    var appsPath = path.join(__dirname, '../..', appDirectory, appName);

    verbose && logger.info('\n   %s:', appName);

    var obj = require(appsPath),
            name = obj.name || appName,
            prefix = obj.prefix || '',
            app = express();

    // allow specifying the view engine
    if (obj.engine) app.set('view engine', obj.engine);

    app.set('views', path.join(appsPath, 'views'));

    var publicFolder = path.join(appsPath, 'public');
    if (isThere.sync(publicFolder)) {
        //set static content for plugin - All static content must be in the /plugin-name/public folder
        parent.use('/' + name + '/public/', static(publicFolder));
    }

    app.get('/' + name + '/views/:file', function (req, res) {
        res.render(req.params.file);
    });

    app.locals.pretty = true;
    app.locals.basedir = __dirname + '/../../views';

    // before middleware support
    if (obj.before) {
        var beforePath = '/' + name + '/:' + name + '_id';
        app.all(beforePath, obj.before);
        logger.info('     ALL %s -> before',beforePath);

        beforePath += '/*';
        app.all(beforePath, obj.before);
        logger.info('     ALL %s -> before', beforePath);
    }

    for (var key in obj) {
        // "reserved" exports
        if (~['name', 'prefix', 'engine', 'before'].indexOf(key)) continue;

        var routeFile = __dirname + '/routes.js';
        if (isThere.sync('./apps/' + name + '/route.js')) {
            routeFile = './apps/' + name + '/route.js';
        }

        mapRoutes(verbose, key, obj[key], prefix, name, app, routeFile);
    }

    // mount the app
    parent.use(app);
}

var mapRoutes = function (verbose, routeKey, routeValue, prefix, appName, app, routesFilePath) {
    var routesMap = JSON.parse(fs.readFileSync(routesFilePath));

    if (routesMap.hasOwnProperty(routeKey)) {
        var completeRoute = routesMap[routeKey];
        var routesPath = completeRoute[0].path.replace('NAME', appName);
        var method = completeRoute[0].method;

        app[method](prefix + routesPath, routeValue);
        verbose && logger.info('     %s %s -> %s', method.toUpperCase(), routesPath, routeKey);
    } else {
        logger.errror('\n   Broken route reference found.');
    }
}

//Delete routes.
var deleteRoute = function(name){
    var getRoutes = parent.routes.get;
    logger.info(parent.routes)
    // for (var k in getRoutes){
    //     if (getRoutes[k].path && getRoutes[k].path === '/' + name){
    //         getRoutes.slice(k, 1);
    //         return;
    //     }
    // }
}

exports.addRoute = addRoute;
exports.deleteRoute = deleteRoute;
exports.loadRoutes = loadRoutes;
