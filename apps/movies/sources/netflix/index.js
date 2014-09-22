var request = require('request'),
    cheerio = require("cheerio");

request.defaults({
        maxRedirects:20,
        jar: request.jar()
    });

/** Netflix **/
//rather than a seperate web app
//(which would just be the netflix website anyway)
//add the my list into the movies list
//this wants to be plugin like, but this is just a PoC
//Also no way to seperate TV from Movies without 
//making more requests to netflix or metadata service

exports.serviceName = "netflix";

exports.requiredSettings = [
    { name : 'username', type : 'text'},
    { name : 'password', type : 'password'}
];


exports.retrieveMovies = function (callback, settings) {
    if (!settings) {
        callback(null);
        return;
    }
	//from https://gist.github.com/wilson428/8312213#file-scrape-js-L52
    request("https://signup.netflix.com/Login", function(err, resp, body) {
        // cheerio parses the raw HTML of the response into a jQuery-like object for easy parsing
        var $ = cheerio.load(body);
 
        // we're specifically looking for an ID on the page we need to log in, which looks like this: 
        // <input type="hidden" name="authURL" value="1388775312720.+vRSN6us+IhZ1qOSlo8CyAS/ZJ4=">
        var data = settings;
        data.authURL = $("input[name='authURL']").attr("value");
 
        request.post("https://signup.netflix.com/Login", { form: data }, function(err, resp, body) {
            if (err) { throw err; }
            console.log("Successfully logged in.");
            //can only use the default profile :/ 
            //switching profile seems to rely on the netflix api
            //we have to request twice to get around profiles
            request("https://www2.netflix.com/MyList", function (err, resp, body) {
                request("https://www2.netflix.com/MyList", function(err, resp, body) {
                    console.log("received mylist");
                    var $ = cheerio.load(body);
                    var mylistmovies = $(".list-items > .agMovie");
                    var movieData = [];
                    mylistmovies.each(function(i, mylistmovie) {
                        mylistmovie = cheerio(mylistmovie);
                        var a = mylistmovie.find("span > a");
                        var img = mylistmovie.find("span > img");
                        var data = {
                            videoURL : a.attr("href"),
                            title : img.attr("alt"),
                            serviceId : a.attr("data-uitrack").split(",")[0],
                            service: exports.serviceName,
                            posterURL : img.attr("src")
                        };
                        movieData.push(data);
                    });
                    console.log("nF done");
                    callback(movieData);
                });
            });
        });
    });
}