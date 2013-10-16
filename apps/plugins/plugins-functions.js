var express = require('express')
	, app = express()
	, fs = require('fs')
	, ini = require('ini')
	, colors = require('colors')
	, semver = require('semver')
	, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'))
	, exec = require('child_process').exec
	, async = require('async')
	, pluginPrefix = config.pluginPrefix
	, npm = 'npm'
	, search = npm + ' search '
	, install = npm + ' install '
	, upgrade = npm + ' upgrade '
	, remove = npm + ' remove '
	, plugins = []
	, installedPlugins = [];

exports.getAvailablePlugins = function(req, res){

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
            var version = s[5];
            
            var compareInfo = isPluginCurrentlyInstalled(installedPlugins, name, version)
            
			var plugin = {
				name: name.replace(pluginPrefix, ''), //Remove the Mediacenterjs-
				desc: desc,
				author: s[0].substr(1),
				date: s[2] + ' ' + s[3],
				version: version,
				isInstalled: compareInfo.isInstalled,
				isUpgradable: compareInfo.isUpgradable
			}

			plugins.push(plugin);
		});

		res.json(plugins);
	};
	
	var isPluginCurrentlyInstalled = function(array, name, version){
		
		var info = {
			isInstalled: false,
			isUpgradable: false
		};
		if (array instanceof Array === false){
			return info;
		}
		array.forEach(function(val){
			if (val.name === name) {
				info.isInstalled = true;
				info.isUpgradable = semver.gt(val.info.version, version);
				return false; //break loop;
			}
		});
		return info;
	};
	
	var getInstalledPlugins = function(){
		var nodeModules = __dirname + '/../../node_modules';
		fs.readdirSync(nodeModules).forEach(function(name){
			//Check if the folder in the node_modules starts with the prefix
			if(name.substr(0, pluginPrefix.length) !== pluginPrefix){
				return;
			}
			
			var info = {};
                
			fs.readFile(nodeModules + '/' + name + '/package.json' , function (err, data) {
              if (err){ 
                console.error("Error: Unable to read Installed Plugins package.json");
                return false;
              }
              info = JSON.toJSON(data);
            });
            
			var plugin = {
				name: name,
				info: info
			};
			
			installedPlugins.push(plugin);
		});
	};

};	

exports.uninstallPlugin = function(req, res, pluginName){
	console.log('Plugins.uninstallPlugin', pluginName);
	
	if (!pluginName || pluginName === undefined)
		return;

	var name = pluginPrefix + pluginName;
	console.log('Plugins.uninstallPlugin: Uninstalling ' + name);

	exec(remove + name, function callback(error, stdout, stderr){
		if (error){
			console.log("Error: Unable to uninstall plugin: " + name);
			return;
		} else {		
			console.log('Plugins.uninstallPlugin: Uninstalled');
			res.redirect('/plugins/');
		}
	});
};


exports.upgradePlugin = function(req, res, pluginName){
	console.log('Plugins.uninstallPlugin', pluginName);
	
	if (!pluginName || pluginName === undefined)
		return;

	var name = pluginPrefix + pluginName;
	console.log('Plugins.upgradePlugin: Uninstalling ' + name);

	exec(upgrade + name, function callback(error, stdout, stderr){
		if (error){
			console.log("Error: Unable to upgrade plugin: " + name);
			return;
		} else {		
			console.log('Plugins.upgradePlugin: Uninstalled');
			res.redirect('/plugins/');
		}
	});
};

exports.installPlugin = function(req, res, pluginName){
	console.log('Plugins.installPlugin', pluginName);
	if (!pluginName || pluginName === undefined)
		return;

	var name = pluginPrefix + pluginName;
	console.log('Plugins.installPlugin: Installing ' + name);
	exec(install + name, function callback(error, stdout, stderr){
		if (error){
			console.log("Error: Unable to install plugin: " + name);
			return;
		} else {
			console.log('Plugins.installPlugin: installed');			
			res.redirect('/plugins/');
		}
	});
};