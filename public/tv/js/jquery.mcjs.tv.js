/*
 MediaCenterJS - A NodeJS based mediacenter solution

 Copyright (C) 2013 - Jan Smolders

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* TODO: Make this Knockout or angular.

Currently implemented with jQuery is a very quick and dirty and way to heavy solution to keep the paste in the project.
Refactor needed!

*/

;(function($, window, document, undefined) {
    'use strict';
    var ns = 'mcjstv',
        methods = {
            getEpisodes: function getEpisodes(showTitle) {
                return this.each(function() {
                    var o = _getInstanceOptions(this);
                    _getEpisodes(o,showTitle);
                });
            }
        };

    function _init(options) {

        if (!_allDependenciesAvailable()) {return false ;}

        var opts = $.extend(true, {}, $.fn[ns].defaults, options);

        return this.each(function() {

            var $that = $(this),
                o = $.extend(true, {}, opts, $that.data(opts.datasetKey));

            // add data to the defaults (e.g. $node caches etc)
            o = $.extend(true, o, {
                $that : $that
            });

            // use extend(), so no o is used by value, not by reference
            $.data(this, ns, $.extend(true, o, {}));


            $(o.episodesListElem +' > li').remove();
        });
    }

    /* mandatory check for all the dependencies to external libraries */
    function _allDependenciesAvailable() {

        var err = [];

        // Examples. Add one such line for each dependency
        // if (typeof $.fn.shared === 'undefined') err.push('$.fn.shared');

        if (err.length > 0) {
            alert(ns + ' jQuery plugin has missing lib(s): ' + err);
        }
        return err.length === 0;
    }

    /* retrieve the options for an instance for public methods*/
    function _getInstanceOptions(instance) {
        var o = $.data(instance, ns);
        if (!o) {
            console.error( 'jQuery.fn.' + ns + ': a public method is invoked before initializing the plugin. "o" will be undefined.');
        }

        return o;
    }

    /* private methods
     */

    function _getEpisodes(o,showTitle){

        var url = "/tv/show/"+showTitle;
        $.ajax({
            url: url,
            type: 'get'
        }).complete(function(data) {
            if(data.responseText !== null || data !== undefined){

                var episodes = JSON.parse(data.responseText);

                $(o.showElem +' li').each(function() {
                    var elem = $(this);
                    var localTitle =  elem.find(o.titleElem).text();

                    $.each(episodes, function(i, item) {

                        var localName   = item.localName;
                        var showTitle   = item.title;
                        var episode     = item.episode;

                        if(localTitle === showTitle){
                            elem.find(o.episodesListElem).append('<li><a title="'+localName+'" class="episode">Episode '+episode+'</a></li>');
                        }

                    });

                });

                $('.episode').on('click', function(e){
                    e.preventDefault();
                    var filename = $(this).attr('title');
                    $('body').mcjsplay('play',filename);
                });

            }
        });
    }

    $.fn[ns] = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if ( typeof method === 'object' || !method) {
            return _init.apply(this, arguments);
        } else {
            $.error( 'jQuery.fn.' + ns + '.' +  method + '() does not exist.');
        }
    };

    /* default values for this plugin */
    $.fn[ns].defaults = {
        datasetKey          : ns.toLowerCase(), //always lowercase
        showElem            : '.tvshows',
        titleElem           : '.showTitle',
        episodesListElem    : '.episodes',
        episodeElem         : '.episode'

    };

})(jQuery, this, this.document);