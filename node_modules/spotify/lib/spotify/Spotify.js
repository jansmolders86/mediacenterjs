var http = require('http');

/**
 * Internal method for creating response hollabacks, should not be used on
 * its own
 */
function makeResponse(hollaback) {
    var chunks = '';

    return function(response) {
        response.setEncoding('utf8');

        response.on('data', function(chunk) {
            chunks += chunk;
        });

        response.on('end', function() {
            var err, json;

            try {
                json = JSON.parse( chunks );
            }
            catch(e) {
                err = e;
                console.log(e);
            }

            hollaback(err, json);
        });
    };
}

module.exports = {
    /**
     * Reverse-lookup a track, artist or album URI
     *
     * @param {Object} Options that should be used to do this query
     *                 `type` and `id` is required
     * @param {Function} The hollaback that'll be invoked once there's data
     */
    lookup: function(opts, hollaback) {
        var query = '/lookup/1/.json?uri=spotify:'+opts.type+':'+opts.id;

        if ( opts.type === 'artist' ) {
            // We include album data on artists to give a bit more context
            query += '&extras=album';
        }

        this.get(query, hollaback);
    },

    /**
     * Search the Spotify library for a track, artist or album
     *
     * @param {Object} Options that should be used to do this query
     *                 `type` and `query` is required
     * @param {Function} The hollaback that'll be invoked once there's data
     */
    search: function(opts, hollaback) {
        var query = '/search/1/'+opts.type+'.json?q='+opts.query;

        this.get(query, hollaback);
    },

    /**
     * Send a request to the Spotify web service API
     *
     * @param {String} The path for this query, see http://developer.spotify.com/en/metadata-api/overview/
     * @param {Function} The hollaback that'll be invoked once there's data
     */
    get: function(query, hollaback) {
        
        var opts = {
            host: "ws.spotify.com",
            path: encodeURI(query),
            method: "GET"
        },
        request = http.request(opts, makeResponse( hollaback ));
        request.end();

        request.on('error', function (err) {
            hollaback (err, {});
        });
    }
};
