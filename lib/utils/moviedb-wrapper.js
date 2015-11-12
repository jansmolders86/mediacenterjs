
// tmdb currently allows 40 requests per 10 seconds
var PERIOD = 10000; // 10 seconds
var MAX_REQUESTS = 40;

var waiting = [];
var pending = [];
var timeoutID = null;

function processRequests(newRequest) {
    timeoutID && clearTimeout(timeoutID);

    newRequest && waiting.push(newRequest);

    var expired = Date.now() - PERIOD;
    while (pending.length && (pending[0] < expired)) {
        pending.shift();
    }

    if ((pending.length < MAX_REQUESTS - 1) && waiting.length) {
        waiting.shift()(); // start next request
        pending.push(Date.now());
    }

    if (waiting.length) {
        timeoutID = setTimeout(processRequests, PERIOD / MAX_REQUESTS);
    }
}

module.exports = function(api_key, base_url) {
    var moviedb = require('moviedb')(api_key, base_url);
    moviedb.token = {expires_at: '2100-01-01'}; // we don't need the token, prevent a request for it from being made

    var search = function (method, searchOptions) {
        var resolve, reject;

        var promise = new Promise(function(res, rej) {
            resolve = res;
            reject = rej;
        });

        var makeRequest = function () {
            method.call(moviedb, searchOptions, function(err, result) {

                if (err && (err.status === 429)) {
                    // over request limit, try again later
                    processRequests(makeRequest);
                    return;
                }

				
                if (err || (result && result.results !== undefined && result.results.length < 1)) {
                    reject(err);
                } else{
				
					if(result.results !== undefined && result.results.length) {
						resolve(result.results[0]);
					} else {
						reject(err);
					}
					
                }
            });
        };

        processRequests(makeRequest);

        return promise;
    };

    return {
        searchMovie: function (searchOptions) {
            return search(moviedb.searchMovie, searchOptions);
        },
        searchTv: function (searchOptions) {
            return search(moviedb.searchTv, searchOptions);
        }
    };
};
