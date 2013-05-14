# Lingua

Lingua is a middleware for the Express.js framework that helps you to internationalise your webapp easily. It determines the language of the user agent and pushes the i18n resources to your views.

## Installation

    $ npm install lingua

## Quick Start

Using lingua comes down with four simple steps:

1. **Grab lingua**

    ```javascript

    var express = require('express'),
        lingua  = require('lingua');

    ...
    // Express init code goes here
    ...    

    // Express app configuration code and lingua init.
    app.configure(function() {
        ...
        app.set('views', __dirname + '/views');
        app.set('view engine', 'ejs');

        // Lingua configuration
        app.use(lingua(app, {
            defaultLocale: 'en',
            path: __dirname + '/i18n'
        }));

        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.static(__dirname + '/public'));
        app.use(app.router);

        ...
    });
    ```
    _Note:_ Please ensure that the call: "app.use(app.router);" is the last entry in your configuration section.

2. **Create i18n resource files** - Note that you have to create a resource file for your default language. (In this example: './i18n/en.json' and './i18n/de-de.json').

    ```javascript
    // en.json
        {
            "title": "Hello World",
            "content": {
                "description": "A little description."
            }
        }

    // de-de.json
        {
            "title": "Hallo Welt",
            "content": {
                "description": "Eine kleine Beschreibung."
            }
        }
    ```

3.    
    a.  **Use lingua in your views - Static output** - Note that the syntax depends on your template engine. In this example it is: [ejs](http://embeddedjs.com/) and the request comes from a browser which sends 'en' with the HTTP request header.

    ```html
    <h1><%= lingua.title %></h1> <!-- out: <h1>Hello World</h1> -->
    <p><%= lingua.content.description %></h1> <!-- out: <p>A little description.</p> -->
    ```

    b.  **Use lingua in your views - Dynamic output** - Sometimes it is necessary to handle dynamic data within your express route and pass it to the template. What if your i18n resource includes placeholders ("{key}") within a string where you can put in your dynamic data? Well, it is possible. First of all, look at this i18n resource file:

    ```javascript
    // de.json
    {
        "greeting": "Hallo {name}. Dieser Schlüssel {code} wurde für Dich generiert."
    }
    ```

    Now it is possible to transfer an object from your route into your template:

    ```javascript
    app.get('/', function(req, res) {
        var names = ['Sarah', 'Thomas', 'Claudia'];

        res.render('index', {
            person: {
                name: names[Math.floor(Math.random()*names.length)],
                code: Math.round(Math.random()*100)
            }
        });
    });
    ```

    And finally you can execute the i18n resource (yes, you can execute it (: ) and pass your data model to this function:

    ```html
    <p><%= lingua.greeting(person) %></p>
    ```

    _Note:_ Every i18n resource which contains placeholders like in the example above is a function after you've started the application.

4.  **Let the user select a language** - Note that the user's selection is persisted within a cookie. This is an optional step. If you want to let lingua determine the user language from the browser configuration then leave this step out. Anyway, this is a very handy feature for switching the language by a user decision.

    ```html
    <a href="?language=de-DE">de-DE</a>
    <a href="?language=en-US">en-US</a>
    ```

    You can configure lingua in order to change the name of this parameter.

    ```javascript

    // Express app configuration code and lingua init.
    app.configure(function() {
        ...

        // Lingua configuration
        app.use(lingua(app, {
            defaultLocale: 'en',
            path: __dirname + '/i18n',
            storageKey: 'lang' // http://domain.tld/?lang=de
        }));

        ...
    });
    ```

    The cookie lingua uses expires in one year, and includes the httpOnly flag to prevent clientside access from Javascript. You can override these settings by providing a cookieOptions key during configuration.

    ```javascript

    // Express app configuration code and lingua init.
    app.configure(function() {
        ...

        // Lingua configuration
        app.use(lingua(app, {
            defaultLocale: 'en',
            path: __dirname + '/i18n',
            storageKey: 'lang', // http://domain.tld/?lang=de
            cookieOptions: {
                domain: '.domain.tld',    // to allow subdomains access to the same cookie, for instance
                path: '/blog',            // to restrict the language cookie to a path
                httpOnly: false,          // if you need access to this cookie from javascript on the client
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000),  // expire in 1 day instead of 1 year
                secure: true              // for serving over https
            }
        }));

        ...
    });
    ```

    


## Example Application

There is an example application at [./example](https://github.com/akoenig/express-lingua/tree/master/example)

To run it:

    $ cd example
    $ node app.js

You can find a deployed version of this app [here](http://express-lingua-demo.herokuapp.com).

## License

[MIT License](http://www.opensource.org/licenses/mit-license.php)

## Author

Copyright (c) 2013, [André König](http://iam.andrekoenig.info)