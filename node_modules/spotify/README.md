node-spotify
============
Extremely simple (and somewhat hackish) API library for the Spotify REST API.

Install
---
The easiest way to use node-spotify is to install it with npm: `npm install spotify`

API
---
Currently, there's only three (useful) methods available:

```javascript
lookup: function({ type: 'artist OR album OR track', id: 'Spotify ID Hash' }, hollaback)
```

```javascript
search: function({ type: 'artist OR album OR track', query: 'My search query' }, hollaback)
```

```javascript
get: function(query, hollaback) -- See http://developer.spotify.com/en/metadata-api/overview/
```

Example
-------
```javascript
var spotify = require('node-spotify');

spotify.search({ type: 'track', query: 'dancing in the moonlight' }, function(err, data) {
    if ( err ) {
        console.log('Error occurred: ' + err);
        return;
    }

    // Do something with 'data'
});
```
