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
var express = require('express')
    , app = express()
    , fs = require('fs')
    , ini = require('ini')
    , semver = require('semver')
    , config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'))
    , exec = require('child_process').exec
    , async = require('async')
    , npm = require('npm')
    , pluginPrefix = config.pluginPrefix
    , npm = require('npm')
    , search = npm + ' search '
    , install = npm + ' install '
    , upgrade = npm + ' upgrade '
    , remove = npm + ' remove '
    , blackList = require('../../configuration/plugin-blacklist.js').blackList
    , configuration_handler = require('../../lib/handlers/configuration-handler')
    , logger = require('winston');

var getInstalledPlugins = function(){
    var nodeModules = __dirname + '/../../node_modules';
    var installedPlugins = [];

    fs.readdirSync(nodeModules).forEach(function(name){
        //Check if the folder in the node_modules starts with the prefix
        if(name.substr(0, pluginPrefix.length) !== pluginPrefix){
            return;
        }

        var info = {};
        var data = fs.readFileSync(nodeModules + '/' + name + '/package.json' , 'utf8');

        try {
            info = JSON.parse(data);
        } catch(e) {
            info.version = "0.0.0";
        }

        var plugin = {
            name: name,
            info: info
        };

        installedPlugins.push(plugin);
    });
    return installedPlugins;
};

exports.getAvailablePlugins = function(req, res){
    logger.info('Looking for available plugins...');

    var installedPlugins = getInstalledPlugins();

    var npmSearch = function(search, callback){
        npm.load([], function (err, npm) {
            if (err) {
                callback(err);
            } else {
                  npm.commands.search(search, function(err, res){
                    if (err) {
                        logger.error('NPM Search Error ' + err);
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            }
        });
    }

    npmSearch(["mediacenterjs-"], function(err, pluginList){
        if (!pluginList || err) {
            logger.error('Error: Searching for plugins: ' + err);
            res.json({
                error: 1,
                message: 'Error: Unable to get a list of the available plugins.'
            });
        } else {
            var plugins = Object.keys(pluginList)
            .filter(function (pluginName) {
                return blackList.indexOf(pluginName) === -1;
            })
            .map(function(pluginName) {
                var pluginObj = pluginList[pluginName];
                var compareInfo = isPluginCurrentlyInstalled(installedPlugins, pluginObj.name, pluginObj.version);
                var d = new Date(pluginObj.time);

                return {
                    name: pluginObj.name.replace(pluginPrefix, ''), //Remove the Mediacenterjs-
                    desc: pluginObj.description,
                    author: pluginObj.maintainers[0].replace('=',''),
                    date: d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear(),
                    version: pluginObj.version,
                    keywords: pluginObj.keywords,
                    isInstalled: compareInfo.isInstalled,
                    isUpgradable: compareInfo.isUpgradable
                };
            });
            res.json(plugins);
        }
    });

    var isPluginCurrentlyInstalled = function(array, name, version){
        var info = {
            isInstalled: false,
            isUpgradable: false
        };
        for (i in array) {
            var val = array[i];
            if (val.name === name) {
                if (semver.gt(version, val.info.version)) {
                    info.isUpgradable = true;
                }
                info.isInstalled = true;
                break;
            }
        }
        return info;
    };
};

exports.pluginManager = function(req, res, pluginName, action){
    logger.info('Plugins.pluginManager', pluginName);
    if (!pluginName || pluginName === undefined || !action || action === undefined){
        res.json({
            error: 1,
            message: "Invalid parameters"
        })
        return;
    }
    var name = pluginPrefix + pluginName;
    logger.info('Plugins.pluginManager: ' + action + 'ing ' + name);


    npm.load([], function (err, npm) {
          var plugin = [name];
        switch(action){
            case "install":
                  npm.commands.install(plugin, cb);
            break;
            case "upgrade":
                npm.commands.upgrade(plugin, cb);
            break;
            case "remove":
                  npm.commands.remove(plugin, cb);
            break;
        }
    });

    var cb = function(err, result){
        if (err) {
            logger.error('Error: Unable to ' + action + ' plugin: ' + name + '\n' + err);
            res.json({
                error: 1,
                message: 'Unable to ' + action + ' ' + pluginName+ '.'
            });
        } else {
            logger.error('Plugins.pluginManager: ' + action + 'ed.');
            var msg = '';
            switch(action){
                case "install":
                      msg = "installed";
                break;
                case "upgrade":
                    msg = "upgraded";
                break;
                case "remove":
                      msg = "upgraded";
                break;
            }
            res.json({
                error: 0,
                message: pluginName +  ' ' + msg + ' successfully.'
            });
        }
    }
};

exports.reloadServer = function(req, res){
    logger.info('Please wait, restarting server');
    configuration_handler.saveSettings(config, function(){
        logger.info('done');
        res.json('');
    });
}

