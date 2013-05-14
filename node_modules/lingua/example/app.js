/*
 * express-lingua 
 * Example application
 *
 * Licensed under the MIT:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright (c) 2013, André König (andre.koenig -[at]- gmail [*dot*] com)
 *
 */
/**
 * Module dependencies.
 */

var express = require('express')
  , lingua = require('../lib/lingua')
  , http = require('http');

var app = express();

// Configuration

app.configure(function () {
    app.set('port', process.env.PORT || 8080);

    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');

    // Lingua configuration
    app.use(lingua(app, {
        defaultLocale: 'de-de',
        path: __dirname + '/i18n'
    }));

    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res) {
    var names = ['Andrea', 'Sarah', 'Thomas', 'Claudia', 'Kimberly', 'Sam'];

    res.render('index', {
        person: {
            name: names[Math.floor(Math.random()*names.length)],
            code: Math.round(Math.random()*100)
        }
    });
});

http.createServer(app).listen(app.get('port'), function() {
  console.log("lingua example app listening on port " + app.get('port'));
});