/* Global imports */
var colors = require('colors');

/**
 Makes an AJAX-Call.
 @param url 			URL to call
 @param callback		Callback function
 */
exports.xhrCall = function (url, callback) {
	var request = require("request");

	request({
		url: url,
		headers: { "Accept": "application/json" },
		method: "GET"
	}, function (error, response, body) {
		if(!error) {
			callback(body);
		} else {
			console.log('Helper: XHR Error', error .red);
			setTimeout(function(){
				console.log('Helper: Waiting for retry...' .yellow)
			}, 10000);
		}
	});
};

/**
 Writes data to a JSON file and then returns the contents to the client.
 @param writePath 	    Path to store file
 @param dataToWrite	    Data to write to file
 @param callback        The Callback (returns the contents as string)
 */
exports.writeToFile = function (writePath, dataToWrite, callback){
	var fs = require('fs');

	fs.writeFile(writePath, dataToWrite, function(writeErr) {
		if (!writeErr) {
			fs.readFile(writePath, 'utf8', function (readErr, data) {
				if(!readErr){
					callback(data);
				}else{
					console.log('Cannot read data', readErr .red);
				}
			});
		} else {
			console.log('Error getting data', writeErr .red);
		}
	});
};
