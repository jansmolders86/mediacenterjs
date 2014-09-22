var request = require('request'),
    cheerio = require("cheerio"),
    fs = require("fs");

request.defaults({
        maxRedirects:20,
        jar : false
    });

exports.serviceName = "iplayer";
exports.requiredSettings = [
    { name : 'username', type : 'text' },
    { name : 'password', type : 'password'}
];
exports.retrieveMovies = function (callback, settings) {
    console.log("Startting iplayer");
    // if (!settings) {
    //     callback(null);
    //     return;
    // }
    var data = {
        unique : settings.username,
        password : settings.password
    }
    var headers = {
        Referer : "http://bbc.co.uk",
        Origin : "https://ssl.bbc.co.uk"
    }
    request.post("https://ssl.bbc.co.uk/id/signin", {form : data, headers : headers}, function  (err, resp, body) {
        request("https://www.bbc.co.uk/iplayer/usercomponents/favourites/programmes.json", function (err, resp, body) {
            console.log(body);
            callback(null);
        });
        
    });
}