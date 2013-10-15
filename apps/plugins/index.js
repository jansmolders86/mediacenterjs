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

exports.engine = 'jade';

var express = require('express')
, app = express()
, fs = require('fs')
, ini = require('ini')
, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'));
var exec = require('child_process').exec;
var async = require('async');

exports.index = function(req, res, next){	

	var npm = 'npm'
	  , search = npm + ' search '
	  , install = npm + ' install '
	  , remove = npm + ' remove '
	  , pluginPrefix = config.pluginPrefix
	  , plugins = []
	  , errorMsg
	  , installedPlugins = [];

	var contains = function(array, value){
		if (array instanceof Array === false)
			return false;

		var isFound = false;
		array.forEach(function(val){
			if (val === value) {
				isFound = true;
				return false; //break loop;
			}
		});
		return isFound;
	};

	var buildPluginList = function(stdout){

		var list = stdout.split('\n');
		var plugins = [];
		list.forEach(function(p, i){
			//First removes header, 
			//second removes blank lastline.
			//third removes npm upddates
			if (p.substr(0, 4) === 'NAME' || i === list.length - 1 || p.substr(0,3) === 'npm') return;  
			var s = p.split(' ');
			var name = s[0];

			p = p.replace(name, '');
			s = p.split('=');
			var desc = s[0];
			p = p.replace(desc, '');
			s = p.split(' ');

			var plugin = {
				name: name.replace(pluginPrefix, ''), //Remove the Mediacenterjs-
				desc: desc,
				author: s[0].substr(1),
				date: s[2] + ' ' + s[3],
				version: s[5],
				isInstalled: contains(installedPlugins, name)
			}

			plugins.push(plugin);
		});

		return plugins;
	};

	var getAvailablePlugins = function(){

		exec(search + pluginPrefix, function callback(error, stdout, stderr){
			//TODO: NEED TO CACHE THE SEARCH RESULTS!!! SLOWWWWWW Page loads.

			if (error){
				var errorMsg = 'Error: Unable to retieve plugins list';
				console.log(errorMsg);
			}

			var plugins = buildPluginList(stdout);

			res.render('plugins', {
				errorMsg:errorMsg,
				plugins: plugins,
				i18n: {
					search: "Search",
					install: "Install",
					remove: "Uninstall",
					refresh: "Refresh"
				}
			});

		});
	};

	//search node_modules for installed plugins
	var getInstalledPlugins = function(){
		
		var nodeModules = __dirname + '/../../node_modules';
		
		fs.readdirSync(nodeModules).forEach(function(name){

			//Check if the folder in the node_modules starts with the prefix
			if(name.substr(0, pluginPrefix.length) !== pluginPrefix)
				return;

			installedPlugins.push(name);
			
		});
	};

	//TODO: Not sure if this work, not tested yet...
	//Also I dont know how to hook this up with jade.
	var uninstallPlugin = function(pluginName){
		console.log('Plugins.uninstallPlugin');

		if (!plugin || plugin === undefined)
			return;

		var name = pluginPrefix + pluginName;

		console.log('Plugins.uninstallPlugin: Uninstalling ' + name);

		exec(remove + name, function callback(error, stdout, stderr){
			if (error){
				console.log("Error: Unable to uninstall plugin: " + name);
				return;
			}			
			console.log('Plugins.uninstallPlugin: Uninstalled');			
		});
	};


	//TODO: Not sure if this work, not tested yet...
	//Also I dont know how to hook this up with jade.
	var installPlugin = function(pluginName){
		console.log('Plugins.installPlugin');

		if (!plugin || plugin === undefined)
			return;

		var name = pluginPrefix + pluginName;

		console.log('Plugins.installPlugin: Installing ' + name);

		exec(install + name, function callback(error, stdout, stderr){
			if (error){
				console.log("Error: Unable to install plugin: " + name);
				return;
			}			
			console.log('Plugins.installPlugin: installed');			
		});
	};

	var init = function(){
		getInstalledPlugins();
		getAvailablePlugins();
	};
	
	init()
};