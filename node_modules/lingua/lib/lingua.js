/*
 * express-lingua
 * An i18n middleware for the Express.js framework.
 *
 * Licensed under the MIT:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright (c) 2013, André König (andre.koenig -[at]- gmail [*dot*] com)
 *
 */
var Guru = require('./guru'),
    Trainee = require('./trainee');

module.exports = function (app, options) {

    "use strict";

    var _name = 'lingua',
        config = {},
        guru,
        trainee;

    //
    // The lingua configuration object.
    //
    config.storage = {
        key: options.storageKey || 'language'
    };

    config.cookieOptions = options.cookieOptions || {};

    config.resources = {
        path: options.path,
        defaultLocale: options.defaultLocale,
        extension: '.json',
        placeholder: /\{(.*?)\}/
    };

    //
    // Verify the given parameters.
    //
    // So the middleware init call should look like:
    //
    //     app.configure(function() {
    //         // Lingua configuration
    //         app.use(lingua(app, {
    //             defaultLocale: 'en',
    //             path: __dirname + '/i18n'
    //         }));
    //     });
    //
    // It is necessary to define the "default locale" and the "path"
    // where lingua finds the i18n resource files.
    //
    if (!config.resources.defaultLocale) {
        throw new Error(_name + ': Please define a default locale while registering the middleware.');
    }

    if (!config.resources.path) {
        throw new Error(_name + ': Please define a path where ' + _name +  ' can find your locales.');
    } else {
        if (config.resources.path[config.resources.path.length] !== '/') {
            config.resources.path = config.resources.path + '/';
        }
    }

    //
    // Creating the mighty guru object which knows everything.
    //
    guru = new Guru(config);

    //
    // Creating the trainee object which is like a helper for the guru.
    //
    trainee = new Trainee(config);

    //
    // summary:
    //     Inits the view helper.
    //
    // description:
    //     To be able to access the defined i18n resource in
    //     the views, we have to register a dynamic helper. With
    //     this it is possible to access the text resources via
    //     the following directive. Be aware that it depends on
    //     the syntax of the used template engine. So for "jqtpl"
    //     it would look like:
    //
    //         ${lingua.attribute}
    //
    //     # Example #
    //
    //     de-de.json:
    //         {
    //             "title": "Hallo Welt",
    //             "content": {
    //                 "description": "Eine kleine Beschreibung."
    //             }
    //         }
    //
    //     en.json:
    //         {
    //             "title": "Hello World",
    //             "content": {
    //                 "description": "A little description."
    //             }
    //         }
    //
    //     index.html (de-de in the HTTP request header):
    //         <h1>${lingua.title}</h1> <!-- out: <h1>Hallo Welt</h1> -->
    //         <p>${lingua.content.description}</h1> <!-- out: <p>Eine kleine Beschreibung.</p> -->
    //
    //

    // # Compatibility check
    if ('function' === typeof app.dynamicHelpers) { // Express < 3.0
        app.dynamicHelpers({
            lingua: function (req, res){
                return res.lingua.content;
            }
        });
    } else if ('function' === typeof app.locals.use) { // Express 3.0
        app.locals.use(function (req, res) {
            res.locals.lingua = res.lingua.content;
        });
    }

    //
    // summary:
    //     The middleware function.
    //
    // description:
    //     This function will be called on every single
    //     HTTP request.
    //
    return function lingua(req, res, next) {
        var locales,
            resource;

        //
        // Determine the locale in this order:
        // 1. URL query string, 2. Cookie analysis, 3. header analysis
        //
        locales = trainee.determineLocales(req, res);

        // Get the resource.
        resource = guru.ask(locales);

        // Save the current language
        trainee.persistCookie(req, res, resource.locale);

        // Bind the resource on the response object.
        res.lingua = resource;

        // # Compatibility check
        if ('function' === typeof app.locals) { // Express 3.0 RC
            res.locals.lingua = res.lingua.content;
        }

        next();
    };
};
