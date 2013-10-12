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

	var npm = 'npm';
	var search = npm + ' search ';
	var install = npm + ' install ';
	var remove = npm + ' remove ';
	var stdout;
	var availablePlugins = function(){

		// async.series([
		// 	function(callback){

		// 		callback()
		// 	}
		// 	});	
		// 	]), function(){

		// } 



	}

	var installedPlugins = function(){


	}

	var uninstallPlugin = function(name){

	}

	exec(search + 'mediacenterjs-', function callback(error, stdout, stderr){
		
		//THIS IS NOT EVEN CLOSE TO WORKING
		//NEED TO CACHE THE SEARCH RESULTS!!! SLOWWWWWW


		var list = stdout.split('\n');
		var plugins = [];
		list.forEach(function(p){
			if (p.substr(0, 4) === 'NAME') return;

			var s = p.split(' ');
			var name = s[0];

			p = p.replace(name, '');

			s = p.split('=');
			var desc = s[0];

			p = p.replace(desc, '');

			s = p.split(' ');

			var plugin = {
				name: name,
				desc: desc,
				author: s[0],
				date: s[2] + ' ' + s[3],
				version: s[5]

			}

			plugins.push(plugin);
		});


		res.render('plugins', {
			plugins: plugins
		});

	});
			
};