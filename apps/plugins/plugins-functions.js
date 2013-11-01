var express = require('express')
	, app = express()
	, fs = require('fs')
	, ini = require('ini')
	, colors = require('colors')
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
	, plugins = []
	, installedPlugins = []
	, upgradablePluginList = []
	, configuration_handler = require('../../lib/handlers/configuration-handler');

var getInstalledPlugins = function(){
	var nodeModules = __dirname + '/../../node_modules';
	installedPlugins = [];
	upgradablePluginList = [];

	fs.readdirSync(nodeModules).forEach(function(name){
		//Check if the folder in the node_modules starts with the prefix
		if(name.substr(0, pluginPrefix.length) !== pluginPrefix){
			return;
		}
		
		var info = {};
		var data = fs.readFileSync(nodeModules + '/' + name + '/package.json' , 'utf8');
        
        try{
        	info = JSON.parse(data);
        }catch(e){
        	console.log('JSON Parse Error')
        	info = {
        		version: "0.0.0"
        	}
        }
		
		var plugin = {
			name: name,
			info: info
		};
				
		installedPlugins.push(plugin);
	});
};

exports.getAvailablePlugins = function(req, res){

	console.log('Looking for available plugins..(pluginsList.' .green);
	
	getInstalledPlugins();
	var plugins = [];

	async.waterfall([
		function(callback){
			npmSearch(["mediacenterjs-"], function(pluginList){
				if (pluginList){
					callback(null, pluginList);
				}else{
					callback("NPM Search Error");
				}
			});
		}, 
		function(pluginList, callback){
			for (var key in pluginList) {
				var obj = pluginList[key];
		   	  	var compareInfo = isPluginCurrentlyInstalled(installedPlugins, obj.name, obj.version);          
		   		plugins.push({
					name: obj.name.replace(pluginPrefix, ''), //Remove the Mediacenterjs-
					desc: obj.description,
					author: obj.maintainers[0].replace('=',''),
					date: obj.time,
					version: obj.version,
					keywords: obj.keywords,
					isInstalled: compareInfo.isInstalled,
					isUpgradable: compareInfo.isUpgradable
				});
		   }
		   callback(null, plugins);
		}, 
		function(plugins, callback){
			res.json({
                plugins:plugins,
                upgradablePlugins: upgradablePluginList
        	});	
		}],

	function(err){

		if (err){
			console.log('Something went wrong: ' + err)
		}
	});

	var npmSearch = function(search, callback){
		npm.load([], function (err, npm) {
		  	npm.commands.search(search, function(err, res){
				if (err)
					console.log('NPM Search Error ' + err);
				
				callback(res);
			});
		});
	}



	var isPluginCurrentlyInstalled = function(array, name, version){
		
		var info = {
			isInstalled: false,
			isUpgradable: false
		};


		array.forEach(function(val){
			if (val.name === name) {
				var isUpgradable = false;
				if (semver.gt(version, val.info.version)){
					isUpgradable = true;
				}

				info.isInstalled = true;
				info.isUpgradable = isUpgradable;

				if (isUpgradable){
					upgradablePluginList.push(val.name.substr(pluginPrefix.length));
				}

				return false; //break loop;
			}
		});
		
		return info;
	};
};	

exports.pluginManager = function(req, res, pluginName, action){
	console.log('Plugins.pluginManager', pluginName);
	if (!pluginName || pluginName === undefined || !action || action === undefined){
		res.json({
			error: 1,
			message: "Invalid parameters"
		})
		return;
	}
	var name = pluginPrefix + pluginName;
	console.log('Plugins.pluginManager: ' + action + 'ing ' + name);
	
	exec(npm + ' ' + action + ' ' + name, function callback(error, stdout, stderr){
		console.log(npm + ' ' + action + ' ' + name)
		console.log(stdout)
		if (error){
			console.log('Error: Unable to ' + action + ' plugin: ' + name + '\n' + error);
			
			res.json({
				error: 1,
				message: 'Unable to ' + action + ' ' + pluginName+ '.'
			});

			return;

		} else {
			console.log('Plugins.pluginManager: ' + action + 'ed.');			
				
			res.json({
				error: 0,
				message: pluginName +  ' ' + action + ' successfully.'  
			});
			
		}
	});
};

exports.reloadServer = function(req, res){
	console.log('Please wait, restarting server');
	var currentSettings = {
			moviepath: config.moviepath,
			musicpath: config.musicpath,
			tvpath: config.tvpath,
			language: config.language,
			localIP: config.localIP,
			remotePort: config.remotePort,
			location: config.location,
			spotifyUser: config.spotifyUser,
			spotifyPass: config.spotifyPass,
			theme: config.theme,
			port:  config.port }
	configuration_handler.saveSettings(currentSettings, function(){
		console.log('done');
		res.json('');
	});
}

