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
	, installedPlugins = []
	, upgradablePluginList = [];

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

	console.log('Looking for available plugins...' .green);
	
	getInstalledPlugins();

	exec(search + pluginPrefix, function callback(error, stdout, stderr){
		//TODO: NEED TO CACHE THE SEARCH RESULTS!!! SLOWWWWWW Page loads.
		if (error){
			var message = 'Error: Unable to retieve plugins list <br /> ' + stderr; 
			console.log(message);
			res.json({message:message, plugins:[]});
			return;

		} else {
			var plugins = buildPluginList(stdout);
			res.json({
				plugins:plugins,
				upgradablePlugins: upgradablePluginList
			});
		}
	});

	//Parse the output of the npm search command 
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
			
			//clean up whitespace
			p = p.replace(/    /g, ' ');
			p = p.replace(/   /g, ' ');
			p = p.replace(/  /g, ' ');
			
			s = p.split(' ');
			var author = s[0].substr(1);
			var date = s[1] + ' ' + s[2];
            var version = s[3];
           	var keywords = [];
            for (var i=4; i<s.length; i++){
            	keywords.push(s[i]);
            }

            var compareInfo = isPluginCurrentlyInstalled(installedPlugins, name, version);
            
			var plugin = {
				name: name.replace(pluginPrefix, ''), //Remove the Mediacenterjs-
				desc: desc,
				author: author,
				date: date,
				version: version,
				keywords: keywords,
				isInstalled: compareInfo.isInstalled,
				isUpgradable: compareInfo.isUpgradable
			}

			plugins.push(plugin);
		});
		
		return plugins;
	};
	
	var isPluginCurrentlyInstalled = function(array, name, version){
		
		var info = {
			isInstalled: false,
			isUpgradable: false
		};


		array.forEach(function(val){

			if (val.name === name) {
				var isUpgradable = false;
				if (semver.gt(version, val.info.version))
					isUpgradable = true;

				info.isInstalled = true;
				info.isUpgradable = isUpgradable;

				if (isUpgradable)
					upgradablePluginList.push(val.name.substr(pluginPrefix.length));


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

			if(action === 'install' || action === 'remove'){
				console.log('CALLING...')
				var http = require('http');

				var options = {
				  host: 'localhost',
				  port: 3000,
				  path: '/plugins/routeManager?action='+ action +'&plugin=' + pluginPrefix + pluginName
				};

				callback = function(response) {
				  var str = '';

				  //another chunk of data has been recieved, so append it to `str`
				  response.on('data', function (chunk) {
				    str += chunk;
				  });

				  //the whole response has been recieved, so we just print it out here
				  response.on('end', function () {
				    console.log(str);
				  });
				}

				http.request(options, callback).end();
			}
		}
	});
};

