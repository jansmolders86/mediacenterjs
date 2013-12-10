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

	var ns = 'mcjsm';
	var methods = {

	};

	function _init(options) {
		var opts = $.extend(true, {}, $.fn.mcjsm.defaults, options);
		return this.each(function() {
			var $that = $(this);
			var o = $.extend(true, {}, opts, $that.data(opts.datasetKey));
				
			// add data to the defaults (e.g. $node caches etc)	
			o = $.extend(true, o, { 
				$that: $that,
				movieCache : [],
                platform:'browser'
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
			_setViewmodel(o);
			_getItems(o);
			
			$that.on('scroll resize', function() {
				_lazyload(o);
				_positionElement(o);

			});	
			
			_showAndFilterAvailableGenres(o);
		});
	}
	
	/**** Start of custom functions ***/
	
	// Create movie model
	//TODO: put in separate file 
	var Movie = function (o, json) {
		var that = this;
		this.localName 		= ko.observable(json);
		this.posterImage 	= ko.observable();
		this.backdropImage	= ko.observable();
		this.genre 			= ko.observable();
		this.runtime 		= ko.observable();
		this.overview 		= ko.observable();
		this.title 			= ko.observable();
		this.cdNumber 		= ko.observable();
		this.isActive 		= ko.observable();
		this.playMovie = function () {
            window.location.hash = that.localName();
            that.isActive(o.activeMovieId);

            var movieTitle = that.localName();
            var url = _checkPlatform(o, movieTitle);
			_playMovie(o, url);
		};
	}

    function _checkPlatform(o, movieTitle){
        if( navigator.platform === 'iPad' || navigator.platform === 'iPhone' || navigator.platform === 'iPod' ){
            o.platform = 'IOS'
            var url = '/movies/play/'+movieTitle+'/ios';
        } else if(navigator.userAgent.toLowerCase().indexOf("android") > -1){
            o.platform = 'Android'
            var url = '/movies/play/'+movieTitle+'/android';
        }else {
            o.platform = 'browser'
            var url = '/movies/play/'+movieTitle+'/browser';
        }
        return url;
    }

	
	function _positionElement(o){
		var startFromTopInit = $('#moviebrowser').offset().top > 50;
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
			o.viewModel.movies = ko.observableArray();
			ko.applyBindings(o.viewModel,o.$that[0]);
		}	
	}
	
	function _getItems(o){
		$.ajax({
			url: '/movies/loadItems', 
			type: 'get',
			dataType: 'json'
		}).done(function(data){	
			var listing = [];
			$.each(data, function () {
				// create movie model for each movie
				var movie = new Movie(o, this);
				listing.push(movie);
				
				// add model to cache
				o.movieCache[this] = movie;
			});
			
			// Fill viewmodel with movie model per item
			o.viewModel.movies(listing);
			o.viewModel.movies.sort();

            if(window.location.hash) {
                var movieTitle =window.location.hash.substring(1);
                var url = _checkPlatform(o, movieTitle);
                _playMovie(o,url);
            } else{
                _lazyload(o);
            }

		});
	}
	
	function _handleVisibleMovies(o, movieTitle, visibleMovie, title){
		var url = '/movies/info/'+movieTitle;
        console.log(url);
		if(movieTitle !== undefined){
			$.ajax({
				url: url, 
				type: 'get'
			}).done(function(data){
				// If current item is in cache, fill item with values
				if (o.movieCache[title]) {
					setTimeout(function(){
						var movieData = data[0]
						, movie = o.movieCache[title];
						 
						movie.posterImage(movieData.poster_path);
						movie.backdropImage(movieData.backdrop_path);
						movie.genre(movieData.genre);
						movie.runtime(movieData.runtime);
						movie.overview(movieData.overview);
						movie.title(movieData.original_name);
						movie.cdNumber(movieData.cd_number);
						
						visibleMovie.addClass('showDetails '+o.fadeClass);
						
					},500);
				}
				
				_focusedItem(o);
                _scrollBackdrop(o);
			});
		}		
	}
	
	function _lazyload(o){
		//TODO: Make this an KO extender
		setTimeout(function(){
			//Set time-out for fast scrolling
			var WindowTop = $('body').scrollTop()
			, WindowBottom = WindowTop + $('body').height();

			$(o.movieListSelector+' > li').each(function(){
				var offsetTop = $(this).offset().top
				, offsetBottom = offsetTop + $(this).height();

				if(!$(this).attr("loaded") && WindowTop <= offsetBottom && WindowBottom >= offsetTop){
					var title = $(this).find('span.title').html();
					if (title !== undefined){
						var movieTitle = title.replace(/.(avi|mkv|mpeg|mpg|mov|mp4|wmv|txt)/gi,"")
						, visibleMovie = $(this);
						_handleVisibleMovies(o, movieTitle, visibleMovie, title);
					}
					$(this).attr("loaded",true);
				}
			});	
		},500);
	}
	
	
	/******** Jquery only functions *********/
	
	//TODO: Put in separate file
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

	function _showAndFilterAvailableGenres(o){
		$.ajax({
			url: '/movies/getGenres/', 
			type: 'get'
		}).done(function(data){

			if($('#'+o.genreSelector).length == 0){
				$(o.wrapperSelector).append('<ul id="'+o.genreSelector+'"></ul>')
			} else{
				$(o.genreSelector).remove();
				$(o.wrapperSelector).append('<ul id="'+o.genreSelector+'"></ul>');
			}
			
			// Sort array and remove duplicates.
			data.sort();
			for ( var i = 1; i < data.length; i++ ) {
				if ( data[i] === data[ i - 1 ] ) data.splice( i--, 1 );
			}

			// Print sorted array
			data.forEach(function(value, index) {
				$('#'+o.genreSelector).append('<li> <a href="'+value+'" class="genrelink">'+value+'</a></li>');
			});
			$('#'+o.genreSelector).append('<li> <a href="" class="showAll">All movies</a></li>');
			
			$('.genrelink').on('click tap',function(e) {
				e.preventDefault();	
				var selectedGenre = $(this).attr('href')
				, filterUrl = '/movies/filter/'+selectedGenre;

				$.ajax({
					url: filterUrl,
					type: 'get'
				}).done(function(data){
		
					$.ajax({
						url: filterUrl,
						type: 'get'
					}).done(function(data){
						var listing = [];
						$.each(data, function() {
							var movieData 	= $(this)[0]
							, local_name 	= movieData.local_name

							// create movie model for each movie
							var movie = new Movie(local_name);
							listing.push(movie);
							
							// add model to cache
							o.movieCache[local_name] = movie;
						});
						
						// Fill viewmodel with movie model per item
						o.viewModel.movies(listing);
						o.viewModel.movies.sort();
						
						_lazyload(o);
					});
	
				});
			});
			
			$('.showAll').on('click tap',function(e) {
				e.preventDefault();	
				window.location.href = '/movies';
			});
		});
	}

	function _playMovie(o,url){
		$.ajax({
			url: url,
			type: 'post'
		});

        var myPlayer;

        $('#wrapper, .movies, #header').hide();

        _resetBackdrop(o);

        $('body').animate({backgroundColor: '#000'},500).addClass('playingMovie');

        setTimeout(function(){
            if($('#'+o.playerID).length > 1) {
                $('#'+o.playerID).remove();
            } else {
                if(o.platform === 'Android' || o.platform === 'IOS'){
                    $('#wrapper, .movies, #header, #backdrop').hide();
                    $('body').append('<video id="'+o.playerID+'" controls width="100%" height="100%"></video>');

                    var myVideo = document.getElementsByTagName('video')[0];
                    myVideo.src = url;
                    myVideo.load();
                    myVideo.play();
                    myVideo.onended = function(e){
                        window.location.replace("/movies/");
                    }

                } else if(o.platform === 'browser'){
                    $('body').append('<video id="'+o.playerID+'" class="video-js vjs-default-skin" controls preload="auto" width="100%" height="100%"><source src="" type="video/mp4"></video>');

                    videojs(o.playerID, {}, function(){
                        myPlayer = this;
                        myPlayer.src("/data/movies/output.mp4");
                        setTimeout(function(){
                            $('.vjs-loading-spinner, #backdrop').hide();
                            myPlayer.play();
                            _pageVisibility(o);
                        },10000)
                        myPlayer.on('error', function(e){ console.log('Error', e) });
                    });
                }
            }
        },10000);

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