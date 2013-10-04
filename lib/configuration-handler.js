/* Global imports */
var fs = require('fs');

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
	var ini = require('ini');
	config = ini.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
};
