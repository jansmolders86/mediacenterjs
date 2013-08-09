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
  , fs = require('fs')
  , colors = require('colors');

module.exports = function(parent, options){
	var verbose = options.verbose;
	fs.readdirSync(__dirname + '/../apps').forEach(function(name){
		verbose && console.log('\n   %s:', name .green.bold);
		var obj = require('./../apps/' + name)
		, name = obj.name || name
		, prefix = obj.prefix || ''
		, app = express()
		, method
		, path
		, routes = []
		, secondaryRoutes = [];
		

		// allow specifying the view engine
		if (obj.engine) app.set('view engine', obj.engine);
		app.set('views', __dirname + '/../apps/' + name + '/views');
		app.locals.pretty = true;
	
		// before middleware support
		if (obj.before) {
			path = '/' + name + '/:' + name + '_id';
			app.all(path, obj.before);
			console.log('     ALL %s -> before', path);
			path = '/' + name + '/:' + name + '_id/*';
			app.all(path, obj.before);
			console.log('     ALL %s -> before', path);
		}
		
		for (var key in obj) {
			// "reserved" exports
			if (~['name', 'prefix', 'engine', 'before'].indexOf(key)) continue;
			
			routes = fs.readFileSync('./configuration/routes.js')
			var routesMap = JSON.parse(routes);

			if (routesMap.hasOwnProperty(key)) {
				// Parse default route JSON
				var completeRoute = routesMap[key];
				placeholderPath = completeRoute[0].path;
				path = placeholderPath.replace('NAME',name);
				method = completeRoute[0].method;
			} else if(fs.existsSync('./apps/' + name +'/route.js')){
				// Parse app specific route JSON if present
				secondaryRoutes = fs.readFileSync('./apps/' + name +'/route.js')
				var secondaryRoutesMap = JSON.parse(secondaryRoutes);
				
				if (secondaryRoutesMap.hasOwnProperty(key)) {
					var completeRoute = secondaryRoutesMap[key];
					placeholderPath = completeRoute[0].path;
					path = placeholderPath.replace('NAME',name);
					method = completeRoute[0].method;
				}
			} else {
				console.log('\n   Broken route reference found.)' .red.bold)
			}
						
			path = prefix + path;
			app[method](path, obj[key]);
			verbose && console.log('     %s %s -> %s', method.toUpperCase(), path, key);	
		}

		// mount the app
		parent.use(app);
	});
};