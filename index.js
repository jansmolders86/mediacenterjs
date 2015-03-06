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
    , fs = require ('fs-extra')
    , isThere = require('is-there')
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
    , dbSchema = require('./lib/utils/database-schema')
    , bodyParser = require('body-parser')
    , static = require('serve-static')
    , favicon = require('serve-favicon')
    , errorHandler = require('errorhandler')
    , http = require('http')
    , os = require('os')
    , jade = require('jade')
    , open = require('open')
    , configuration_handler = require('./lib/handlers/configuration-handler')
    , server = http.createServer(app)
    , io = require('./lib/utils/setup-socket')(server)
    , methodOverride = require('method-override')
    , logger = require('./lib/utils/logging')
    , apps = require("./lib/utils/apps");


var config = configuration_handler.initializeConfiguration();
var ruleSchedule = null;
var language = null;
if(config.language === ""){
    language = 'en';
} else {
    language = config.language;
}

/*Create database*/
if(isThere.sync('./lib/database/') === false){
    fs.mkdirSync('./lib/database/');
}
var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
    app.set('view engine', 'jade');
    app.set('views', __dirname + '/views');
    app.setMaxListeners(100);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(methodOverride('_method'));
    app.use(static(__dirname + '/public'));
    app.use(favicon(__dirname + '/public/core/favicon.ico'));
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
    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
    app.locals.pretty = true;
    app.locals.basedir = __dirname + '/views';
};



/* CORS */
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

mcjsRouting.loadRoutes(app,{ verbose: !module.parent });

app.get("/apps", function(req, res) {
    res.json(apps.getApps());
});

app.get("/", function(req, res, next) {

    DeviceInfo.storeDeviceInfo(req);

    if(config.language === '' || config.location === '' || config.moviepath === undefined){

        res.render('setup',{
            countries:require('./lib/utils/countries').countries
        });

    } else {

        req.setMaxListeners(0);

        DeviceInfo.isDeviceAllowed(req, function(allowed){
            res.render('index', {
                title: 'Homepage',
                selectedTheme: config.theme,
                allowed: allowed
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

    rimraf(appDir, function (e){
        if(e){
            logger.error('Error removing module',{error: e})
        }
    });
    rimraf(publicdir, function (e) {
        if(e) {
            logger.error('Error removing module',{error:e})
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
    } else {
        res.status(404).send();
    }
});

app.post('/clearCache', function(req, res) {
    var app_cache_handler = require('./lib/handlers/app-cache-handler');
    var incommingCache = req.body
        , cache = incommingCache.cache
        , tableName = cache.split(',');

    tableName.forEach(function(name) {
        logger.info('clearing cache',{name : name})
        app_cache_handler.clearCache(name, function(err) {
            if (err) {
                logger.error('Error removing module',{error:e})
                return res.send('Error clearing cache', e);
            }
            var schema = require('./lib/utils/database-schema');
            schema[name].destroy();
        });
    });

    return res.send('done');
});

app.get('/checkForUpdate', function(req, res){
    versionChecker.checkVersion(req, res);
});

app.get('/doUpdate', function(req, res){
    logger.info('First, download the latest version From Github.');
    var src = 'https://codeload.github.com/jansmolders86/mediacenterjs/zip/master';
    var output = './master.zip';
    var dir = './install'
    var options = {};

    fileHandler.downloadFile (src, output, options, function(output){
        logger.info('Done', {Output: output});
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

app.get('/ip',function(req,res){
    res.send(getIPAddresses());
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

//Socket.io Server
remoteControl.remoteControl();

//Scheduler
scheduler.schedule();

app.set('port', process.env.PORT || 3000);

app.use(function(req, res) {
    res.status(404).render('404',{ selectedTheme: config.theme});
});

// Open App socket
if (config.port == "" || config.port == undefined ){
    var defaultPort = app.get('port');
    logger.warn('First run, Setup running on localhost:',{port: defaultPort});
    server.listen(parseInt(defaultPort));
    var url = 'http://localhost:'+defaultPort;
    open(url);

} else{
    var message = "MediacenterJS listening on port:" + config.port + "\n";
    logger.info(message);
    server.listen(parseInt(config.port));
}

/** Private functions **/

function unzip(req, res, output, dir){
    var src = 'https://codeload.github.com/jansmolders86/mediacenterjs/zip/master';
    var outputFile = './master.zip';
    var ExtractDir = './install'
    var options = {};

    if(isThere.sync(dir) === false){
        fs.mkdirSync(dir);
    } else {
        rimraf(dir, function (err) {
            if(err) {
                logger.error('Error removing temp folder',{error: err });
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
    logger.info("Unzipping New Version...");
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
