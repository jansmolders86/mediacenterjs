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

	var ns = 'mcjstv';
	var methods = {

	};

	function _init(options) {
		var opts = $.extend(true, {}, $.fn.mcjstv.defaults, options);
		return this.each(function() {
			var $that = $(this);
			var o = $.extend(true, {}, opts, $that.data(opts.datasetKey));
				
			// add data to the defaults (e.g. $node caches etc)	
			o = $.extend(true, o, { 
				$that: $that,
				tvShowCache : []
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
			_setViewmodel(o);
			_getItems(o);
			
			$that.on('scroll resize', function() {
				_lazyload(o);
				_positionElement(o);

			});	

		});
	}
	
	/**** Start of custom functions ***/
	
	// Create tvShow model
	//TODO: put in separate file 
	var Tvshow = function (o, json) {
		var that = this;
		this.localName 		= ko.observable(json);
		this.title 		    = ko.observable();
		this.banner 	    = ko.observable();
		this.genre 			= ko.observable();
        this.certification 	= ko.observable();
		this.isActive 		= ko.observable();
		this.playtvShow = function () {
            window.location.hash = that.localName();
            that.isActive(o.activetvShowId);

            var tvShowTitle = that.localName();
            var url = _checkPlatform(o, tvShowTitle);
            _playtvShow(o,url,tvShowTitle);
		};
	}

    function _checkPlatform(o, tvShowTitle){
        if( navigator.platform === 'iPad' || navigator.platform === 'iPhone' || navigator.platform === 'iPod' ){
            var url = '/tv/'+tvShowTitle+'/play/ios';
        } else if(navigator.userAgent.toLowerCase().indexOf("android") > -1){
            var url = '/tv/'+tvShowTitle+'/play/android';
        }else {
            var url = '/tv/'+tvShowTitle+'/play/browser';
        }
        return url;
    }

	
	function _positionElement(o){
		var startFromTopInit = $('#tvShowbrowser').offset().top > 50;
		if (startFromTopInit){
            $('#backdrop').removeClass('shrink');
        } else {
            $('#backdrop').addClass('shrink');
		}
	};

	
	function _setViewmodel(o){
		if (!o.viewModel) {
			// create initial viewmodel
			o.viewModel = {};
			o.viewModel.tvshow = ko.observableArray();
			ko.applyBindings(o.viewModel,o.$that[0]);
		}	
	}
	
	function _getItems(o){
		$.ajax({
			url: '/tv/loadItems',
			type: 'get',
			dataType: 'json'
		}).done(function(data){
			var listing = [];
			$.each(data, function () {

                console.log('sdf', data);

				// create tvShow model for each tvShow
				var tvShow = new Tvshow(o, this);
				listing.push(tvShow);
				
				// add model to cache
				o.tvShowCache[this] = tvShow;
			});

			// Fill viewmodel with tvShow model per item
			o.viewModel.tvshow(listing);
			o.viewModel.tvshow.sort();

            if(window.location.hash) {
                var tvShowTitle =window.location.hash.substring(1);
                var url = _checkPlatform(o, tvShowTitle);
                _playtvShow(o,url,tvShowTitle);
            } else{
                _lazyload(o);
            }

		});
	}
	
	function _handleVisibletvShows(o, tvShowTitle, visibletvShow, title){
        console.log('asd')
		var url = '/tv/'+tvShowTitle+'/info';
		if(tvShowTitle !== undefined){
			$.ajax({
				url: url, 
				type: 'get'
			}).done(function(data){
				// If current item is in cache, fill item with values

				if (o.tvShowCache[title]) {
					setTimeout(function(){
						var tvShowData = data[0]
						, tvShow = o.tvShowCache[title];
						 
						tvShow.title(tvShowData.title);
						tvShow.banner(tvShowData.banner);
						tvShow.genre(tvShowData.genre);
						tvShow.certification(tvShowData.certification);

                        visibletvShow.addClass('showDetails '+o.fadeClass);
						
					},500);
				}
			});
		}		
	}
	
	function _lazyload(o){
		//TODO: Make this an KO extender
		setTimeout(function(){
			//Set time-out for fast scrolling
			var WindowTop = $('body').scrollTop()
			, WindowBottom = WindowTop + $('body').height();

			$(o.tvShowListSelector+' > li').each(function(){
				var offsetTop = $(this).offset().top
				, offsetBottom = offsetTop + $(this).height();

				//if(!$(this).attr("loaded") && WindowTop <= offsetBottom && WindowBottom >= offsetTop){
					var title = $(this).find('span.title').html();

                console.log('title',title)

					if (title !== undefined){
						var tvShowTitle = title.replace(/.(avi|mkv|mpeg|mpg|mov|mp4|wmv)$/,"")
						, visibletvShow = $(this);

                        console.log('tvShowTitle',tvShowTitle)

						_handleVisibletvShows(o, tvShowTitle, visibletvShow, title);
					}
					$(this).attr("loaded",true);
				//}
			});	
		},500);
	}
	
	
	/******** Jquery only functions *********/

	function _playtvShow(o,url,tvShowTitle){
    
        $('body').animate({backgroundColor: '#000'},500).addClass('playingtvShow');

        $('#wrapper, .tvShows, #header').hide();


        if($('#'+o.playerID).length > 1) {
            $('#'+o.playerID).remove();
        }

        var fileName =  tvShowTitle.replace(/\.[^.]*$/,'')
        , outputName =  fileName.replace(/ /g, "-")
        , videoUrl =  "/data/tv/"+outputName+".mp4";
                
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

                    _setDurationOftvShow(player, data);
                    _pageVisibility(o);
                },5000);

                player.on('error', function(e){
                    console.log('Error', e);
                });

                player.on('timeupdate', function(e){
                   _setDurationOftvShow(player, data);
                });

                player.on('progress', function(e){
                    _setDurationOftvShow(player, data);
                });

                player.on('pause', function(e){
                    currentTime = player.currentTime();
                    var tvShowData = {
                        'tvShowTitle': tvShowTitle,
                        'currentTime': currentTime
                    }
                    $.ajax({
                        url: '/tvShows/sendState',
                        type: 'post',
                        data: tvShowData
                    });

                    $('.vjs-slider').on('click',function(e) {
                        console.log('click!',this)
                        if (e.target === this){
                            e.preventDefault();
                        }
                    });
                });

                player.on('loadeddata', function(e){
                    _setDurationOftvShow(player, data);
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
                        window.location.replace("/tv/");
                    }
                });

            });


        });
	}
	
	function _setDurationOftvShow(player, data){
	   var videoDuration = player.duration(data.duration);  
		player.bufferedPercent(0);
		$('.vjs-duration-display .vjs-control-text').text(videoDuration);
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
	
	$.fn.mcjstv = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || !method ) {
			return _init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.fn.mcjstv' );
		}
	};
	
	/* default values for this plugin */
	$.fn.mcjstv.defaults = {		
		datasetKey: 'mcjstv' //always lowercase
		, tvShowListSelector: '.tvshows'
		, backdrophandler: 'title'
		, posterClass: 'tvShowposter' 
		, playerSelector: '#player' 
		, headerSelector: '#header' 
		, wrapperSelector: '#wrapper'
		, genreSelector: 'genres' 
		, backLinkSelector: '.backlink' 
		, playerID: 'player' 
		, overlayselector : '.overlay'
        , activetvShowId : 'active'
		, fadeClass: 'fadein' 
		, fadeSlowClass: 'fadeinslow' 
		, focusedClass: 'focused'
		, scrollingClass: 'scrolling'
	};

})(jQuery);
