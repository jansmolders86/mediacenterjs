var express = require('express')
, app = express()
, fs = require('fs');

exports.configuration = function(req, res){
	var configfile = []
	,configfilepath = './configuration/setup.js'
	,configfile = fs.readFileSync(configfilepath)
	,configfileResults = JSON.parse(configfile);	

	res.send(configfileResults)
}