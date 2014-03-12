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
(function($){

    var ns = 'mcjsm'
    ,methods = {
        playMovie: function playMovie(movieTitle) {
            return this.each(function() {
                var o = $.data(this, ns);
                o.locked = false;
                var url = '/movies/'+movieTitle+'/play/';
                _playMovie(o,url,movieTitle);
            })
        }
    };

    function _init(options) {
        var opts = $.extend(true, {}, $.fn.mcjsm.defaults, options);
        return this.each(function() {
            var $that = $(this);
            var o = $.extend(true, {}, opts, $that.data(opts.datasetKey));

            // add data to the defaults (e.g. $node caches etc)
            o = $.extend(true, o, {
                $that: $that,
                movieCache : []
            });

            // use extend(), so no o is used by value, not by reference
            $.data(this, ns, $.extend(true, {}, o));

            _focusedItem(o);
            _scrollBackdrop(o);

            $that.on('scroll resize', function() {
                _positionHeader(o);
            });
        });
    }

    /**** Start of custom functions ***/


    function _positionHeader(o){
        var startFromTopInit = $('#moviebrowser').offset().top > 50;
        if (startFromTopInit){
            $('#backdrop').removeClass('shrink');
        } else {
            $('#backdrop').addClass('shrink');
        }
    };

    function _focusedItem(o){
        $(o.movieListSelector+' > li').on({
            mouseenter: function() {
                var newBackground = $(this).find("img."+o.posterClass).attr(o.backdrophandler);
                $(this).addClass(o.focusedClass);
                $(o.backdropClass).attr("src", newBackground).addClass(o.fadeClass);
            },
            mouseleave: function() {
                $(o.backdropClass).removeClass(o.fadeClass);
                if ($('li.'+o.posterClass+'.'+o.focusedClass).length) {
                    $('li.'+o.posterClass+'.'+o.focusedClass).removeClass(o.focusedClass);
                }
            },
            focus: function() {
                $(this).addClass(o.focusedClass);
                var newBackground = $(this).find("img."+o.posterClass).attr(o.backdrophandler);
                $(o.backdropClass).attr("src", newBackground).addClass(o.fadeClass);
            },
            focusout: function() {
                $(o.backdropClass).removeClass(o.fadeClass);
                if ($('li.'+o.posterClass+'.'+o.focusedClass).length) {
                    $('li.'+o.posterClass+'.'+o.focusedClass).removeClass(o.focusedClass);
                }
            }
        });

        if ($(o.movieListSelector+' > li'+o.focusedClass)){
            var newBackground = $(this).find("img."+o.posterClass).attr(o.backdrophandler);
            $(o.backdropClass).attr("src", newBackground).addClass(o.fadeSlowClass);
        }
    }

    function _scrollBackdrop(o){
        var duration = 40000;
        $(o.backdropClass).animate({
                top: '-380px'
            },
            {
                easing: 'swing',
                duration: duration,
                complete: function(){
                    $(o.backdropClass).animate({
                            top: '-0px'
                        },
                        {
                            easing: 'swing',
                            duration: duration,
                            complete: function(){
                                if(o.stopScroll === false){
                                    _scrollBackdrop(o);
                                }
                            }
                        });
                }
            });
    }


    function _playMovie(o,url,movieTitle){
        $('body').animate({backgroundColor: '#000'},500).addClass('playingMovie');

        $('#wrapper, .movies, #header').hide();

        _resetBackdrop(o);

        if($('#'+o.playerID).length > 1) {
            $('#'+o.playerID).remove();
        }

        var fileName =  movieTitle.replace(/\.[^.]*$/,'')
            , outputName =  fileName.replace(/ /g, "-")
            , videoUrl =  "/data/movies/"+outputName+".mp4";

        $.ajax({
            url: url,
            type: 'get'
        }).done(function(data){

                $('body').append('<video id="'+o.playerID+'" poster class="video-js vjs-default-skin" controls preload="none" width="100%" height="100%"><source src="'+videoUrl+'" type="video/mp4"></video>');

                var player = videojs(o.playerID);
                var currentTime = parseFloat(data.progression);
                player.ready(function() {
                    setTimeout(function(){
                        $('.vjs-loading-spinner, #backdrop').hide();

                        player.load();

                        var setProgression = parseFloat(data.progression);
                        player.currentTime(setProgression);

                        player.play();

                        _setDurationOfMovie(player, data);
                        _pageVisibility(o);
                    },5000);

                    player.on('error', function(e){
                        console.log('Error', e);
                    });

                    player.on('timeupdate', function(e){
                        _setDurationOfMovie(player, data);
                    });

                    player.on('progress', function(e){
                        _setDurationOfMovie(player, data);
                    });

                    player.on('pause', function(e){
                        currentTime = player.currentTime();
                        var movieData = {
                            'movieTitle': movieTitle,
                            'currentTime': currentTime
                        }
                        $.ajax({
                            url: '/movies/sendState',
                            type: 'post',
                            data: movieData
                        });
                    });

                    player.on('loadeddata', function(e){
                        _setDurationOfMovie(player, data);
                        if(currentTime > 0){
                            player.currentTime(currentTime);
                        }
                    });

                    player.on('loadedmetadata', function(e){
                        if(currentTime > 0){
                            player.currentTime(currentTime);
                        }
                    });

                    player.on('ended', function(e){
                        currentTime = player.currentTime();
                        var actualDuration = data.duration;
                        if( currentTime < actualDuration){
                            player.load();
                            player.play();
                        } else{
                            player.dispose();
                            window.location.replace("/movies/");
                        }
                    });

                });

            });
    }

    function _setDurationOfMovie(player, data){
        var videoDuration = player.duration(data.duration);
        player.bufferedPercent(0);
        $('.vjs-duration-display .vjs-control-text').text(videoDuration);
    }


    function _resetBackdrop(o){
        //Remove img and reintroduce it to stop the animation and load the correct backdrop img
        //TODO add lookup on class title if no active item exists.
        var newBackground = $('#'+o.activeMovieId).find("img."+o.posterClass).attr(o.backdrophandler);
        $(o.backdropClass).remove();
        $('#backdrop').append('<img src="'+newBackground+'" class="'+ o.backdropSelector+'">').addClass(o.fadeClass);

        $('#backdrop').removeClass('shrink').css({
            height:'100%',
            backgroundColor: '#000'
        }).append('<div clas="movie-loading"><i class="loading icon"></i></div>');
    }

    function _pageVisibility(o){
        var hidden, visibilityChange;
        if (typeof document.hidden !== "undefined") {
            hidden = "hidden";
            visibilityChange = "visibilitychange";
        } else if (typeof document.mozHidden !== "undefined") {
            hidden = "mozHidden";
            visibilityChange = "mozvisibilitychange";
        } else if (typeof document.msHidden !== "undefined") {
            hidden = "msHidden";
            visibilityChange = "msvisibilitychange";
        } else if (typeof document.webkitHidden !== "undefined") {
            hidden = "webkitHidden";
            visibilityChange = "webkitvisibilitychange";
        }

        function handleVisibilityChange() {
            if (document[hidden]) {
                videojs(o.playerID).pause();
            } else if (sessionStorage.isPaused !== "true") {
                videojs(o.playerID).play();
            }
        }

        if (typeof document.addEventListener === "undefined" || typeof hidden === "undefined") {
            console.log("The Page Visibility feature requires a browser such as Google Chrome that supports the Page Visibility API.");
        } else {
            document.addEventListener(visibilityChange, handleVisibilityChange, false);
        }
    }

    /**** End of custom functions ***/

    $.fn.mcjsm = function( method ) {
        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || !method ) {
            return _init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.fn.mcjsm' );
        }
    };

    /* default values for this plugin */
    $.fn.mcjsm.defaults = {
        datasetKey: 'mcjsmovies' //always lowercase
        , movieListSelector: '.movies'
        , backdropClass: '.backdropimg'
        , backdropSelector: 'backdropimg'
        , backdrophandler: 'title'
        , posterClass: 'movieposter'
        , playerSelector: '#player'
        , headerSelector: '#header'
        , wrapperSelector: '#wrapper'
        , backdropWrapperSelector: '#backdrop'
        , genreSelector: 'genres'
        , backLinkSelector: '.backlink'
        , playerID: 'player'
        , overlayselector : '.overlay'
        , activeMovieId : 'active'
        , fadeClass: 'fadein'
        , fadeSlowClass: 'fadeinslow'
        , focusedClass: 'focused'
        , scrollingClass: 'scrolling'
    };

})(jQuery);