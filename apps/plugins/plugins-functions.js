var express = require('express')
	, app = express()
	, fs = require('fs')
	, ini = require('ini')
	, colors = require('colors')
	, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'))
	, exec = require('child_process').exec
	, async = require('async')
	, pluginPrefix = config.pluginPrefix
	, npm = 'npm'
	, search = npm + ' search '
	, install = npm + ' install '
	, remove = npm + ' remove '
	, plugins = []
	, installedPlugins = [];

exports.getAvailablePlugins = function(req, res){

	var getInstalledPlugins = function(){

		var nodeModules = __dirname + '/../../node_modules';

		fs.readdirSync(nodeModules).forEach(function(name){

			//Check if the folder in the node_modules starts with the prefix
			if(name.substr(0, pluginPrefix.length) !== pluginPrefix)
				return;

			installedPlugins.push(name);

		});
	};

	console.log('Looking for available plugins...' .green)

	exec(search + pluginPrefix, function callback(error, stdout, stderr){
		//TODO: NEED TO CACHE THE SEARCH RESULTS!!! SLOWWWWWW Page loads.
		if (error){
			console.log('Error: Unable to retieve plugins list');
		} else {
			buildPluginList(stdout);
		}
	});

	var buildPluginList = function(stdout){
		var list = stdout.split('\n');
		var plugins = [];
		list.forEach(function(p, i){
			//First removes header, 
			//second removes blank lastline.
			//third removes npm updates
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

		res.json(plugins);
	};
	
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

};	

exports.uninstallPlugin = function(req, res, pluginName){
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


exports.installPlugin = function(req, res, pluginName){
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