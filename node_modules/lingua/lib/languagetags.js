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

//
//
// summary:
//     A class associating language tags with quality values
//
// description:
//     A language tag identifies a language as described at
//     <http://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.10>
//     (e.g. 'en-us'). A quality value (qvalue) determines the
//     relative degree of preference for a language tag . Tags and
//     qvalues are present in the HTTP Accept-Language header
//     (http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.4)
//     (e.g. 'Accept-Language: en-gb,en-us;q=0.7,en;q=0.3')
//
module.exports = (function() {

    "use strict";

    var LanguageTags = function () {
        this.tagQvalues = {}; // associates 'q' values with language tags
    };

    //
    //
    // summary:
    //     Associate a tag with a qvalue
    //
    // description:
    //     More than one tag can be assigned to the same qvalue.
    //
    LanguageTags.prototype.addTag = function (tag, qvalue) {
        try {
            this.tagQvalues[qvalue].push(tag);
        } catch (e) {
            if (!(e instanceof TypeError)) {
                throw e;
            }
            this.tagQvalues[qvalue] = [tag];
        }
    };

    //
    //
    // summary:
    //     Associate multiple tags with a qvalue
    //
    // description:
    //     A convenience method to save calling LanguageTags.addTag() multiple
    //     times.
    //
    LanguageTags.prototype.addTags = function (tags, qvalue) {
        try {
            this.tagQvalues[qvalue].push.apply(this.tagQvalues[qvalue], tags);
        } catch (e) {
            if (!(e instanceof TypeError)) {
                throw e;
            }
            this.tagQvalues[qvalue] = tags;
        }
    };

    //
    //
    // summary:
    //     Get a list of all tags
    //
    // description:
    //     The list of tags is ordered by the associated tag qvalue in
    //     descending order.
    //
    LanguageTags.prototype.getTags = function () {
        // get the reverse ordered list of qvalues e.g. -> [1, 0.8, 0.5, 0.3]
        var qvalues = [],
            qvalue,
            tags = [],
            that = this;
        
        for (qvalue in this.tagQvalues) {
            if (this.tagQvalues.hasOwnProperty(qvalue)) {
                qvalues.push(qvalue);
            }
        }
        qvalues = qvalues.sort().reverse();

        // add the tags to the tag list, ordered by qvalue
        qvalues.forEach(function(qvalue) {
            tags.push.apply(tags, that.tagQvalues[qvalue]);
        });

        return tags;
    };

    return LanguageTags;
}());