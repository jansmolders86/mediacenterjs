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
var url = require('url'),
    Cookies = require('cookies'),
    LanguageTags = require('./languagetags');

module.exports = (function() {

    "use strict";

    var _name = 'lingua:Trainee',
        Trainee;

    //
    // summary:
    //     The trainee object.
    //
    // description:
    //     The trainee is a helper which provides methods for determining
    //     the locales from a given HTTP request header, a cookie and an url query.
    //
    Trainee = function (configuration) {
        var that = this;

        if (!configuration) {
            throw new Error(_name + ': Please pass the configuration to the constructor.');
        } else {
            this.configuration = configuration;
        }

        //
        // summary:
        //     Helper function for extracting the locaes the out of an header.
        //
        // description:
        //     Here we parse the HTTP request headers and extract all language
        //     tags with the given quality value.
        //
        //     See: http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.4
        //
        this._extractLocales = function (headers) {
            var locales = [],
                acceptLanguage = headers['accept-language'],
                tags = new LanguageTags(),
                subtags = new LanguageTags(),
                subtagQvalue;

            if (acceptLanguage) {
                // associate language tags by their 'q' value (between 1 and 0)
                acceptLanguage.split(',').forEach(function (lang) {
                    var parts = lang.split(';'),                       // 'en-GB;q=0.8' -> ['en-GB', 'q=0.8']
                        tag = parts.shift().toLowerCase().trim(),      // ['en-GB', 'q=0.8'] -> 'en-gb'
                        primarySubtag = tag.split('-')[0].trimRight(), // 'en-gb' -> 'en'
                        qvalue = 1,                                    // default qvalue
                        i = 0,
                        part;

                    // get the language tag qvalue: 'q=0.8' -> 0.8
                    for (i = 0; i < parts.length; i++) {
                        part = parts[i].split('=');
                        if (part[0] === 'q' && !isNaN(part[1])) {
                            qvalue = Number(part[1]);
                            break;
                        }
                    }

                    // add the tag and primary subtag to the qvalue associations
                    tags.addTag(tag, qvalue);
                    subtags.addTag(primarySubtag, qvalue);
                });

                // Add all the primary subtags to the tag set if
                // required, using a default low qvalue for the
                // primary subtags.
                subtagQvalue = (isNaN(that.configuration.subtagQvalue)) ? 0.1 : that.configuration.subtagQvalue;
                
                if (subtagQvalue) {
                    tags.addTags(subtags.getTags(), subtagQvalue);
                }

                // add the ordered list of tags to the locales
                locales.push.apply(locales, tags.getTags());

            } else {
                locales.push(configuration.resources.defaultLocale);
            }

            return locales;
        };
    };

    //
    // summary:
    //     Determines the language by a given HTTP request header. If there is a cookie given,
    //     its value overrides the HTTP header. If there is a querystring 'lingua' given, it
    //     overrides the cookie.
    //
    // description:
    //     HTTP request header, cookie and querystring analysis and returns the first found iso
    //     language code.
    //
    // note:
    //     Based on connect-i18n: https://github.com/masylum/connect-i18n/blob/master/lib/connect-i18n.js
    //
    Trainee.prototype.determineLocales = function(req, res) {
        var cookies = new Cookies(req, res),
            headers = req.headers,
            query = req.query[this.configuration.storage.key],
            cookie = cookies.get(this.configuration.storage.key),
            locales = [], // The determined locales which the user has configured.
            locale = (query || cookie);

        if (locale) {
            locales.push(locale);
        } else {
            locales = this._extractLocales(headers);
        }

        return locales;
    };

    //
    // summary:
    //     Persists the given locale.
    //
    // description:
    //     Creates a cookie and persists the given locale in it.
    //
    Trainee.prototype.persistCookie = function(req, res, locale) {
        var cookies = new Cookies(req, res),
            expirationDate = new Date(),
            options = this.configuration.cookieOptions;

        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        var cookieOptions = {
            expires: expirationDate,
            httpOnly: true
        };

        for(var property in options) {
            if(options.hasOwnProperty(property)) {
                cookieOptions[property] = options[property];
            }
        }

        cookies.set(this.configuration.storage.key, locale, cookieOptions);
    };

    return Trainee;
}());
