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

exports.engine = 'jade';

var express = require('express')
, app = express()
, fs = require('fs')
, ini = require('ini')
, http = require('http')
, DeviceInfo = require('../../lib/utils/device-utils')
, config = ini.parse(fs.readFileSync('./configuration/config.ini', 'utf-8'));


getDevices = function (req, res) {
    Device.findAll()
     .success(function (devices) {
        res.json(devices);
     });
}

getData = function (req, res) {
    var allThemes = new Array()
    , availableLanguages = []
    , availablethemes = fs.readdirSync('./public/themes/')
    , availableTranslations = fs.readdirSync('./public/translations/');

    availablethemes.forEach(function(file){
        allThemes.push(file);
    });

    availableTranslations.forEach(function(file){
        if (file.match('translation')){
            var languageCode = file.replace(/translation_|.json/g,"")
            availableLanguages.push(languageCode);
        }
    });

    var availableScreensavers = [
        'dim',
        'backdrop',
        'off'
    ];

    var availableQuality = [
        'lossless',
        'high',
        'medium',
        'low'
    ];

    var tvFormatTypes = [
        's00e00',
        '0x00'
    ];
    res.json({
        availableLanguages : availableLanguages,
        availableQuality : availableQuality,
        availableScreensavers : availableScreensavers,
        tvFormatTypes : tvFormatTypes,
        themes : availablethemes,
        config : config,
        countries : require('../../lib/utils/countries').countries
    });
}

exports.index = function(req, res, next){

    DeviceInfo.storeDeviceInfo(req);

    Device.findAll()
    .success(function (devices) {
        DeviceInfo.isDeviceAllowed(req, function (allowed) {
            res.render('settings', {
                title: 'Settings',
                selectedTheme: config.theme,
                allowed: allowed
            });
        });
    });


};
exports.get = function(req, res, next) {
    var infoRequest = req.params.id
    , optionalParam = req.params.optionalParam
    , action = req.params.action;

    switch(infoRequest) {
        case 'getToken':
            var token = config.oauth;
            if(!token) {
                res.json({message: 'No token'}, 500);
            }
            res.json({token: token});
        break;
        case 'load':
            getData(req, res);
        break;
        case 'devices':
            getDevices(req, res);
        break;
        default:
            next();
    }
};

