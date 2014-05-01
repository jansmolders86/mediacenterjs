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
		if (config.hasOwnProperty(key)) {
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
