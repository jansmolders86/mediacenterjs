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
, app = express()
, fs = require ('fs')
, dateFormat = require('dateformat')
, lingua = require('lingua')
, colors = require('colors')
, rimraf = require('rimraf')
, nconf = require('nconf')
, config = require('./configuration/config.json')
, dblite = require('dblite')
, Youtube = require('youtube-api')
, jade = require('jade')
, http = require('http');

// Init Database
dblite.bin = "./bin/sqlite3/sqlite3";
var db = dblite('./lib/database/mcjs.sqlite');

var language = null;
if(config.language === ""){
	language = 'en';
} else {
	language = config.language;
}

process.env.NODE_ENV = 'development';

app.configure(function(){
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views');
	app.setMaxListeners(100);
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.static(__dirname + '/public'));
	app.use(express.favicon(__dirname + '/public/core/favicon.ico'));
	app.use(lingua(app, {
		defaultLocale: 'translation_'+language,
		storageKey: 'lang',
		path: __dirname+'/public/translations/',
		cookieOptions: {
            httpOnly: false,        
            expires: new Date(Date.now(-1)),  
            secure: false
        }
	}));
	app.use(app.router);
	app.locals.pretty = true;
});

app.configure('development', function(){   
	app.enable('verbose errors');
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));  
});

app.configure('production', function(){
	app.disable('verbose errors');
	app.use(express.errorHandler()); 
});   

require('./lib/routing/routing')(app,{ verbose: !module.parent });

app.use(function(req, res) {
    res.status(404).render('404',{ selectedTheme: config.theme});
    res.status(500).render('404',{ selectedTheme: config.theme});
});

app.get("/", function(req, res, next) {  
	if(	config.moviepath == '' && config.language == '' && config.location == '' || config.moviepath == null || config.moviepath == undefined){
		res.render('setup');	
	} else {
		var apps = []
		//Search app folder for apps and check if tile icon is present
		fs.readdirSync(__dirname + '/apps').forEach(function(name){
			if(fs.existsSync(__dirname + '/public/'+name+'/tile.png')){
				apps.push(name);
			}
		});
		var now = new Date();
		var time = dateFormat(now, "HH:MM");
		var date = dateFormat(now, "dd-mm-yyyy");
		req.setMaxListeners(0)
		res.render('index', {
			title: 'Homepage',
			selectedTheme: config.theme,
			time: time,
			date: date,
			apps: apps
		});	
	}
});


app.post('/removeModule', function(req, res){
	var incommingModule = req.body
	, module = incommingModule.module
	, appDir = './apps/'+module+'/'
	, publicdir = './public/'+module+'/';
	
	rimraf(appDir, function (e){if(e)console.log('Error removing module', e .red)});
	
	rimraf(publicdir, function (e) { 
		if(e) {
			console.log('Error removing module', e .red);
		} else {
			res.redirect('/');
		}
	});
});

app.post('/clearCache', function(req, res){
	var incommingCache = req.body
	, cache = incommingCache.cache
	, rmdir = './public/'+cache+'/data/';
	
	console.log('clearing '+cache+' cache');
	
	fs.readdir(rmdir,function(err,dirs){
		dirs.forEach(function(dir){
			var dataFolder = rmdir+dir
			stats = fs.lstatSync(dataFolder);
			if (stats.isDirectory()) {
				rimraf(dataFolder, function (e) { 		
					if(e){
						console.log('Error removing module', e .red);
						res.send('Error clearing cache', e);
					} else{
						db.query('DROP TABLE IF EXISTS '+cache);
						
						db.on('info', function (text) { console.log(text) });
						db.on('error', function (err) { console.error('Database error: ' + err) });
						
						res.send('done');
					};
				});
			};
		});		
	});
});

app.post('/setuppost', function (req, res){
	writeSettings(req, res, function(){
		res.render('finish');
	});
});

app.get('/configuration', function (req, res){
	res.send(config);
});
app.get('/getToken', function (req, res) {
	var token = config.oauth;
	if(!token) {
		res.json({message: 'No token'}, 500);
	}
	res.json({token: token});
});
app.post('/updateToken', function (req, res) {
	nconf.argv().env().file({file: './configuration/config.json'});
	nconf.set('oauth', req.body.oauth);
	nconf.save(function (error) {
		if(error){
			console.log('Error writing config file.', err);
			res.end('Error with config file.');
			return;
		}
		res.end();
	});
});
app.post('/searchYoutube', function (req, res) {
	searchYoutube(req, function (error, data) {
		if(error) {
			res.json({message: error}, 500);
		}
		res.json(data);
	});
});
app.post('/getCards', function (req, res) {
	getCards(req, function (error, data) {
		if(error) {
			res.json({message: error}, 500);
		}
		res.json({data: data});
	});
});
app.post('/submit', function (req, res){
	writeSettings(req, res, function(){
		res.redirect('/');
	});
});

function writeSettings(req, res, callback){
	nconf.argv().env().file({file: './configuration/config.json'});
	var incommingTheme = req.body.theme
	if (incommingTheme.match(/\.(css)/)){
		themeName = incommingTheme;
	} else {
		themeName = incommingTheme+'.css';
	}
	// TODO add input sanitization
    nconf.set('moviepath', req.body.movielocation);
	nconf.set('musicpath', req.body.musiclocation);
	nconf.set('tvpath', req.body.tvlocation);
	nconf.set('language', req.body.language);
	nconf.set('onscreenkeyboard', req.body.usekeyboard);
	nconf.set('location', req.body.location);
	nconf.set('theme', themeName);
	nconf.set('screensaver', req.body.screensaver);
	nconf.set('spotifyUser', req.body.spotifyUser);
	nconf.set('spotifyPass', req.body.spotifyPass);
	nconf.set('port', req.body.port);
	nconf.set('oauth', req.body.oauth);
	nconf.set('oauthKey', req.body.oauthKey);
	
	nconf.save(function (error) {
		if(error){
			console.log('Error writing config file.',err);  
		} else{
			res.redirect('/');
		}
	});
}

/**
 * Searches youtube given the query as the input parameter from the POST request
 * @param  {Object}   req      The request from the user
 * @param  {Function} callback Callback function to send back
 * @return {Function} callback ^
 */
function searchYoutube(req, callback) {
	Youtube.authenticate({
		type: "oauth",
		token: config.oauth
	});
	Youtube.search.list({q: req.body.q, part: 'snippet', maxResults: 50}, function (error, result) {
		if(error) {
			return callback(error);
		}
		return callback(null, result.items);
	});
}

function getCards(req, callback) {
	var cardAmount = parseInt(req.body.cardAmount);
	fs.readFile('apps/youtube/views/card.jade', 'utf8', function (error, data) {
		if(error) {
			return callback('Error reading template file');
		}
		var fn = jade.compile(data);
		var html = fn();
		var totalHtml = "";
		while(cardAmount !== 0) {
			totalHtml += html;
			cardAmount--;
		}
		return callback(null, totalHtml);
	});
}

app.set('port', process.env.PORT || 3000);

// Open App socket
if (config.port == "" || config.port == undefined ){
	var defaultPort = app.get('port');
	console.log('First run, Setup running on localhost:' + defaultPort);
	app.listen(parseInt(defaultPort));
} else{
	var message = "MediacenterJS listening on port:" + config.port;
	console.log(message.green.bold);
	app.listen(parseInt(config.port));
}
