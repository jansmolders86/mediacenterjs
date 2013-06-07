#  Resanitize - Regular expression-based HTML sanitizer and ad remover, geared toward RSS feed descriptions

This node.js module provides functions for removing unsafe parts and ads from
HTML. I am using it for the &lt;description&gt; element of RSS feeds.

## Installation

npm install resanitize

## Usage

```javascript

    var resanitize = require('resanitize')
      , html = '<div style="border: 400px solid pink;">Headline</div>'
      ;

    resanitize(html); // => '<div>Headline</div>'
```