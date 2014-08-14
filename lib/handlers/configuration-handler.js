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
/* Global imports */
var fs = require('fs'),
	_ = require('underscore');

/* Constants */
var CONFIG_PATH = './configuration/config.ini';
var CONFIG_TEMPLATE_PATH = './configuration/config-template.ini';

/* Variables */
var config = null;

/**
 Checks if the config.ini-File exists and creates it when not.
 */
exports.initializeConfiguration = function () {
	if (!fs.existsSync(CONFIG_PATH)) {
		var template = fs.readFileSync(CONFIG_TEMPLATE_PATH, 'utf-8');
		fs.writeFileSync(CONFIG_PATH, template);
	}

	this.reloadConfiguration();
	return this.getConfiguration();
};

exports.getConfiguration = function () {
	return config;
};

exports.reloadConfiguration = function() {
	var ini  = require('ini'),
		path = require('path');

	var configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
	configContent = configContent.replace('%MainDir%', path.resolve(__dirname + "/../.."));

	config = ini.parse(configContent);
};

exports.saveSettings = function(settings, callback) {
	var ini = require('ini');
	var settingsKeys = Object.keys(settings);
	_.forEach(settingsKeys, function(key) {
		if (settings.hasOwnProperty(key)) {
            config[key] = settings[key];
		}
	});

	fs.writeFile('./configuration/config.ini', ini.stringify(config), function(err){
		if(err) {
			console.error('Error writing INI file.', err);
			callback(err);
		} else {
			callback(null);
		}
	});
}
