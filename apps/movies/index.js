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

/* Modules */
var express = require('express')
, app = express()
, path = require('path')
, config = require('../../lib/handlers/configuration-handler').getConfiguration()
, functions = require('./movie-functions');

/* Configure App (maybe should take environment into consideration too)*/
app.set('views', __dirname + '/views');


/* Set App Routes */
app.get('/',function(req, res){
    res.render('movies', { selectedTheme: config.theme });
});

app.get('/filter/:optionalParam', function(req, res){
    var optionalParam = req.params.optionalParam;
    functions.filter(req, res, optionalParam);
});

app.get('/getGenres', function(req, res){
    functions.getGenres(req, res);
});

app.get('/loadItems', function(req, res){
    functions.loadItems(req,res);
});

app.get('/info/:moviename', function(req, res){
    var movieName = req.params.moviename;
    functions.handler(req, res, movieName);
});

app.post('/play/:moviename/:platform?', function(req, res){
    var movieName = req.params.moviename;
    var platform = req.params.platform || 'browser';

    console.log('Request arrived');
    functions.playMovie(req, res, platform, movieName);
});

/* Listening on mount event to add own public path */
app.on('mount', function(parentApp){
    parentApp.use('/' + path.basename(__dirname) + '/public', express.static(__dirname + '/public'));
});

module.exports = app;