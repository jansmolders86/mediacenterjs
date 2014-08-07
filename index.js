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
	, util = require('util')
	, dateFormat = require('dateformat')
	, lingua = require('lingua')
	, colors = require('colors')
	, rimraf = require('rimraf')
	, mcjsRouting = require('./lib/routing/routing')
	, remoteControl = require('./lib/utils/remote-control')
	, versionChecker = require('./lib/utils/version-checker')
    , scheduler = require('./lib/utils/scheduler')
	, DeviceInfo = require('./lib/utils/device-utils')
    , fileHandler = require('./lib/utils/file-utils')
    , http = require('http')
	, os = require('os')
	, jade = require('jade')
    , open = require('open')
	, configuration_handler = require('./lib/handlers/configuration-handler')
    , airplay = require('./lib/utils/airplay-server');

var config = configuration_handler.initializeConfiguration();
var ruleSchedule = null;
var language = null;
if(config.language === ""){
	language = 'en';
} else {
	language = config.language;
}

/*Create database*/
if(fs.existsSync('./lib/database/') === false){
    fs.mkdirSync('./lib/database/');
    fs.openSync('./lib/database/mcjs.sqlite', 'w');
    fs.chmodSync('./lib/database/mcjs.sqlite', 0755);
}

if(fs.existsSync('./lib/database/mcjs.sqlite') === false){
    fs.openSync('./lib/database/mcjs.sqlite', 'w');
    fs.chmodSync('./lib/database/mcjs.sqlite', 0755);
}

process.env.NODE_ENV = 'development';

app.configure(function(){
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views');
	app.setMaxListeners(100);
    app.use(express.json());
    app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(express.static(__dirname + '/public'));
	app.use(express.favicon(__dirname + '/public/core/favicon.ico'));
	app.use(lingua(app, {
		defaultLocale: 'translation_' + language,
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
	app.locals.basedir = __dirname + '/views';
});



/* CORS */
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.configure('development', function(){
	app.enable('verbose errors');
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.disable('verbose errors');
	app.use(express.errorHandler());
});

mcjsRouting.loadRoutes(app,{ verbose: !module.parent });

app.use(function(req, res) {
    res.status(404).render('404',{ selectedTheme: config.theme});
});

app.get("/", function(req, res, next) {

    DeviceInfo.storeDeviceInfo(req);

	if(config.language === '' || config.location === '' || config.moviepath === undefined){

		var localIP = getIPAddresses()
		, sendLocalIP = '';

		if(getIPAddresses() !== undefined && getIPAddresses() !== null) {
			localIP = getIPAddresses();
		}

		if(localIP[0] !== undefined && localIP[0] !==  null){
			sendLocalIP = localIP[0];
		}

		res.render('setup',{
			localIP:sendLocalIP
		});

	} else {

		var apps = [];

		//Search core app folder for apps and check if tile icon is present
		fs.readdirSync(__dirname + '/apps').forEach(function(name){

			if(fs.existsSync(__dirname + '/public/'+name+'/tile.png')){
				var obj = {
					appLink: name,
					tileLink: name
				}
                if(name === 'movies' && config.moviepath === ""){
                    return;
                } else if(name === 'music' && config.musicpath === "" ){
                    return;
                } else if(name === 'tv' && config.tvpath === "" ){
                    return;
                } else {
                    apps.push(obj);
                }
			}

		});

		//search node_modules for plugins
		var nodeModules = __dirname + '/node_modules';
		var pluginPrefix = config.pluginPrefix;

		fs.readdirSync(nodeModules).forEach(function(name){

			//Check if the folder in the node_modules starts with the prefix
			if(name.substr(0, pluginPrefix.length) !== pluginPrefix){
                return;
            }

			var pluginPath = nodeModules + '/' + name;
			if(fs.existsSync( pluginPath + '/public/tile.png')){
				var obj = {
					appLink: name,
					tileLink: name + '/public'
				}
				apps.push(obj);
			}

		});

		var now = new Date();
		var time = dateFormat(now, "HH:MM");
		var date = dateFormat(now, "dd-mm-yyyy");
		req.setMaxListeners(0);

        DeviceInfo.isDeviceAllowed(req, function(allowed){
            res.render('index', {
                title: 'Homepage',
                selectedTheme: config.theme,
                time: time,
                date: date,
                allowed: allowed,
                apps: apps
            });
        });
	}
});

app.post('/lockClient', function(req, res){
    var incommingDevice = req.body;
    var incommingDeviceID = Object.keys(incommingDevice);
    var deviceID = incommingDeviceID.toString();
    DeviceInfo.lockDevice(req,res,deviceID);
});

app.post('/unlockClient', function(req, res){
    var incommingDevice = req.body;
    var incommingDeviceID = Object.keys(incommingDevice);
    var deviceID = incommingDeviceID.toString();
    DeviceInfo.unlockDevice(req,res,deviceID);
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

app.post('/getScraperData', function(req, res){
    var incommingLink = req.body
    , scraperlink = incommingLink.scraperlink
    , moviesfunctions = require('./apps/movies/movie-functions')
    , musicfunctions = require('./apps/music/music-functions')
    , tvfunctions = require('./apps/tv/tv-functions')
    , serveToFrontEnd = false
    , req // Dummy variable
    , res; // Dummy variable

    if(scraperlink === 'movies'){
        moviesfunctions.loadItems(req, res, serveToFrontEnd);
    } else if (scraperlink === 'music'){
        musicfunctions.loadItems(req, res, serveToFrontEnd);
    } else if (scraperlink === 'tv'){
        tvfunctions.loadItems(req, res, serveToFrontEnd);
    }  else if(scraperlink === 'all'){
        moviesfunctions.loadItems(req, res, serveToFrontEnd);
        setTimeout(function(){
            musicfunctions.loadItems(req, res, serveToFrontEnd);
        },10000);
        setTimeout(function(){
            tvfunctions.loadItems(req, res, serveToFrontEnd);
        },20000);
    }
});

app.post('/clearCache', function(req, res){
	var app_cache_handler = require('./lib/handlers/app-cache-handler');
	var incommingCache = req.body
        , cache = incommingCache.cache
        , tableName = cache.split(',');

    tableName.forEach(function(name) {
        console.log('clearing ' + name + ' cache');
        app_cache_handler.clearCache(name, function(err) {
            if (err) {
                console.log('Error removing module', e .red);
                return res.send('Error clearing cache', e);
            }

            var database = require('./lib/utils/database-connection');
            var db = database.db;
            db.query('DROP TABLE IF EXISTS ' + name);


        });
    });

    return res.send('done');
});

app.get('/checkForUpdate', function(req, res){
	versionChecker.checkVersion(req, res);
});

app.get('/doUpdate', function(req, res){
    console.log('First, download the latest version From Github.');
    var src = 'https://codeload.github.com/jansmolders86/mediacenterjs/zip/master';
    var output = './master.zip';
    var dir = './install'
    var options = {};

    fileHandler.downloadFile (src, output, options, function(output){
        console.log('Done', output);
        unzip(req, res, output, dir);
    });
});

app.post('/setuppost', function(req, res){
	configuration_handler.saveSettings(req.body, function() {
		res.render('finish');
	});
});
// Form  handlers

app.get('/configuration', function(req, res){
	res.send(config);
});

app.post('/submit', function(req, res){
	configuration_handler.saveSettings(req.body, function() {
		res.redirect('/');
	});
});

app.post('/submitRemote', function(req, res){
	configuration_handler.saveSettings(req.body, function() {
		res.redirect('/remote/');
	});
});

//Airplay

function incrementMACAddress(macAddress) {
    return (parseInt(macAddress.replace(/:/g,""), 16) + 1).toString(16).match(/.{2}/g).join(":")
}

airplay.callbacks.video = function (port, url, position) {
    console.log("video play");
};

require('getmac').getMac(function(err,macAddress){
    if (err) throw err;


    airplay.server(7000, macAddress, {name: "Ben"});


    airplay.server(7001, "b9:e8:56:30:b9:84", {name: "Bob"});
});
//Socket.io Server
remoteControl.remoteControl();

//Scheduler
scheduler.schedule();

app.set('port', process.env.PORT || 3000);



// Open App socket

var server = http.createServer(app);



//sockets
var io = require('socket.io').listen(server);
io.set('log level', 1);
io.sockets.on('connection', function (socket) {
    console.log('user connected');
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});


//end sockets

if (config.port == "" || config.port == undefined ){
	var defaultPort = app.get('port');
	console.log('First run, Setup running on localhost:' + defaultPort + "\n");
	server.listen(parseInt(defaultPort));
    var url = 'http://localhost:'+defaultPort;
    open(url);

} else{
	var message = "MediacenterJS listening on port:" + config.port + "\n";
	console.log(message.green.bold);
	server.listen(parseInt(config.port));
}



function unzip(req, res, output, dir){
    var src = 'https://codeload.github.com/jansmolders86/mediacenterjs/zip/master';
    var outputFile = './master.zip';
    var ExtractDir = './install'
    var options = {};

    if(fs.existsSync(dir) === false){
        fs.mkdirSync(dir);
    } else {
        rimraf(dir, function (err) {
            if(err) {
                console.log('Error removing temp folder', err .red);
            } else {

                fileHandler.downloadFile(src, outputFile, options, function(output){
                    console.log('Done', output);
                    setTimeout(function(){
                        unzip(req, res, output, dir);
                    },2000);
                });
            }
        });
    }
    console.log("Unzipping New Version...");
    var AdmZip = require("adm-zip");
    var zip = new AdmZip(output);
    zip.extractAllTo(ExtractDir, true);

    res.json('restarting');
    setTimeout(function(){
        fs.openSync('./configuration/update.js', 'w');
    },1000);
}

function getIPAddresses() {
    var ipAddresses = []
    , interfaces = require('os').networkInterfaces();

    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                ipAddresses.push(alias.address);
            }
        }
    }

    return ipAddresses;
}




