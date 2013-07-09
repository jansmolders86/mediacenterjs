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
, geoip = require('geoip-lite')
, colors = require('colors');


var configfile = []
,configfilepath = './configuration/setup.js'
,configfile = fs.readFileSync(configfilepath)
,configfileResults = JSON.parse(configfile);	

var language = null;
if(configfileResults.language === ""){
	language = 'en';
} else {
	language = configfileResults.language;
}

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
});

app.configure('development', function(){   
	app.enable('verbose errors');
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));  
});

app.configure('production', function(){
	app.disable('verbose errors');
	app.use(express.errorHandler()); 
});   

require('./lib/routing')(app,{ verbose: !module.parent });
app.get("/", function(req, res, next) {  
	if(	configfileResults.moviepath == '' && configfileResults.language == '' && configfileResults.location == '' || configfileResults.moviepath == null || configfileResults.moviepath == undefined){
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
		, locationFound = 'unknown';
		
		if( ip !== '127.0.0.1'){
			var geo = geoip.lookup(ip);
			if(geo !== null) locationFound = geo.city
		} 
		res.render('setup',{
			location: locationFound
		});	
	} else {
		var apps = []
		//Search app folder for apps and check if tile icon is present
		fs.readdirSync(__dirname + '/apps').forEach(function(name){
			if(fs.existsSync(__dirname + '/public/'+name+'/tile.png')){
				apps.push(name)
			}
		});
		var now = new Date();
		var time = dateFormat(now, "HH:MM");
		var date = dateFormat(now, "dd-mm-yyyy");
		req.setMaxListeners(0)
		res.render('index', {
			title: 'Homepage',
			selectedTheme: configfileResults.theme,
			time: time,
			date: date,
			apps: apps
		});	
	}
});

//	Handle settings. Because this is done in one place,
//	keep it in the initial app.js file. 
//	TODO: Add extend to settings from app

app.get("/settings", function(req, res, next) {  

	var allThemes = new Array();
	
	fs.readdir('./public/themes/',function(err,files){
		if (err){
			console.log('Could not get themes',err .red);
		}else{
			files.forEach(function(file){
				allThemes.push(file);
			});

			res.render('settings',{
				moviepath: configfileResults.moviepath,
				selectedTheme: configfileResults.theme,
				musicpath : configfileResults.musicpath,
				tvpath : configfileResults.tvpath,
				highres: configfileResults.highres,
				language: configfileResults.language,
				onscreenkeyboard: configfileResults.onscreenkeyboard,
				location: configfileResults.location,
				screensaver: configfileResults.screensaver,
				showdetails: configfileResults.showdetails,
				themes:allThemes,
				port: configfileResults.port
			});	
			
		}	
	});
	
});

app.post('/setuppost', function(req, res){
	writeSettings(req, res, function(){
		res.render('finish');
	});
});

app.get('/configuration', function(req, res){
	res.send(configfileResults)
});
	
app.post('/submit', function(req, res){
	writeSettings(req, res, function(){
		res.redirect('/');
	});
});

function writeSettings(req, res, callback){
	var myData = {
		moviepath : req.body.movielocation,
		highres: req.body.highres,
		musicpath : req.body.musiclocation,
		tvpath : req.body.tvlocation,
		language : req.body.language,
		onscreenkeyboard: req.body.usekeyboard,
		location: req.body.location,
		screensaver: req.body.screensaver,
		theme: req.body.theme,
		showdetails: req.body.showdetails,
		port: req.body.port
	}
	
	fs.writeFile(configfilepath, JSON.stringify(myData, null, 4), function(e) {
		if(e) {
			res.send(500);
			console.log('Error wrting settings',err .red);
		} else {
			setTimeout(function(){
				callback();
			},1000);			
		}
	}); 
}

// Open App socket
if (configfileResults.port == "" || configfileResults.port == undefined ){
	console.log('Error parsing configfile, falling back to default port' .red)
	app.listen(parseInt(3000));
} else{
	app.listen(parseInt(configfileResults.port));
}


console.log("MediacenterJS listening on port:", configfileResults.port .green); 
