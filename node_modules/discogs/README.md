Discogs: A simple JavaScript wrapper for the Discogs API
========================================================

`discogs` is a simple wrapper for the [Discogs API](http://www.discogs.com/help/api), written in CoffeeScript and usable in e.g. Node.js.

## Version
0.4.2

## Requirements

- [Node](https://github.com/ry/node)
- [request](https://github.com/mikeal/request)

## Installation

Recommended installation is using [npm](https://github.com/isaacs/npm)

    npm install discogs

## Usage

    var discogs = require('discogs');

    var client = discogs({api_key: 'foo4711'});

    client.artist('Marcus Price', function(err, artist) {
        console.log(artist.name); // Marcus Price
    });

## Credits

Linus G Thiel &lt;linus@hanssonlarsson.se&gt;
[Adamansky Anton](https://github.com/adamansky) - Node 0.6 support

## Thank you

- [Discogs](http://discogs.com/) for an outstanding service and a great API
- [Ryan Dahl](https://github.com/ry) for the awesome Node.js
- [Jeremy Ashkenas](https://github.com/jashkenas) for the beautiful CoffeeScript and Docco
- [Mikeal Rogers](https://github.com/mikeal) for request

## License 

(The MIT License)

Copyright (c) 2010 Hansson &amp; Larsson &lt;info@hanssonlarsson.se&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
