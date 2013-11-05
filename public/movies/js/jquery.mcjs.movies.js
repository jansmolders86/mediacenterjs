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
				movieCache : []
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
	var Movie = function (json) {
		var that = this;
		this.localName 		= ko.observable(json);
		this.posterImage 	= ko.observable();
		this.backdropImage	= ko.observable();
		this.genre 			= ko.observable();
		this.runtime 		= ko.observable();
		this.overview 		= ko.observable();
		this.title 			= ko.observable();
		this.cdNumber 		= ko.observable();
		this.playMovie = function () {
			var movieTitle = that.localName();
			var platform = 'browser'
			if( navigator.platform === 'iPad' || navigator.platform === 'iPhone' || navigator.platform === 'iPod' ){
				platform = 'ios';
				var url = '/movies/'+movieTitle+'/play/ios';
			} else if(navigator.userAgent.toLowerCase().indexOf("android") > -1){
				platform = 'android';
				var url = '/movies/'+movieTitle+'/play/android';
			}else {
				var url = '/movies/'+movieTitle+'/play';
			}	
			_playMovie(platform,url);
		};
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
				var movie = new Movie(this);
				listing.push(movie);
				
				// add model to cache
				o.movieCache[this] = movie;
			});
			
			// Fill viewmodel with movie model per item
			o.viewModel.movies(listing);
			o.viewModel.movies.sort();
			
			_lazyload(o);
		});
	}
	
	function _handleVisibleMovies(o, movieTitle, visibleMovie, title){
		var url = '/movies/'+movieTitle+'/info';
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
	
	
	/******** Jquery only  functions *********/ 
	
	//TODO: Put in separate file
	function _focusedItem(o){
		$(o.movieListSelector+' > li').on({
			mouseenter: function() {	
				var newBackground = $(this).find("img."+o.posterClass).attr(o.backdrophandler);
				$(this).addClass(o.focusedClass);
				$(o.backdropSelector).attr("src", newBackground).addClass(o.fadeClass);
			},
			mouseleave: function() {
				$(o.backdropSelector).removeClass(o.fadeClass);
				if ($('li.'+o.posterClass+'.'+o.focusedClass).length) {
					$('li.'+o.posterClass+'.'+o.focusedClass).removeClass(o.focusedClass);
				}
			},			
			focus: function() {		
				$(this).addClass(o.focusedClass);			
				var newBackground = $(this).find("img."+o.posterClass).attr(o.backdrophandler);
				$(o.backdropSelector).attr("src", newBackground).addClass(o.fadeClass);
			},
			focusout: function() {
				$(o.backdropSelector).removeClass(o.fadeClass);
				if ($('li.'+o.posterClass+'.'+o.focusedClass).length) {
					$('li.'+o.posterClass+'.'+o.focusedClass).removeClass(o.focusedClass);
				}
			}
		});	
		
		if ($(o.movieListSelector+' > li'+o.focusedClass)){
			var newBackground = $(this).find("img."+o.posterClass).attr(o.backdrophandler);
			$(o.backdropSelector).attr("src", newBackground).addClass(o.fadeSlowClass);
		}
	}
	
	function _scrollBackdrop(o){
		var duration = 40000
		$(o.backdropSelector).animate({ 
			top: '-380px'
		},
		{
			easing: 'swing',
			duration: duration,
			complete: function(){
				$(o.backdropSelector).animate({ 
					top: '-0px'
				},
				{
					easing: 'swing',
					duration: duration,
					complete: function(){
						_scrollBackdrop(o)
					}
				});	
			}
		});		
	}
	
	//TODO: Clean this up
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
	
	//TODO: make public function
	function _playMovie(platform,url){
		$.ajax({
			url: '/configuration/', 
			type: 'get'
		}).done(function(data){
			var myPlayer;
			$('#wrapper, #header, .movies, #backdrop').hide();
			$('body').animate({backgroundColor: '#000'},500);
			
			if($('#player').length > 1) {
				$('#player').remove();
			} else {
				if(platform === 'android' || platform === 'ios'){
					$('body').append('<video id="player" controls width="100%" height="100%"></video>');
					
					var myVideo = document.getElementsByTagName('video')[0];
					myVideo.src = url;
					myVideo.load();
					myVideo.play();
					myVideo.onended = function(e){window.location="/movies/";}
					
				} else if(platform === 'browser'){
					$('body').append('<video id="player" class="video-js vjs-default-skin" controls preload="auto" width="100%" height="100%" data-setup="{"techOrder": ["flash"]}" > <source src="'+url+'" type="video/flv"></video>');

					videojs("player", {}, function(){
						myPlayer = this;
						$('.vjs-big-play-button').trigger('click');
						myPlayer.on('error', function(e){ console.log('Error', e) });
						myPlayer.on('ended', function(e){ window.location="/movies/"; });
					});
					
					$('.vjs-big-play-button').on('click',function(){
						setTimeout(function(){
							videojs("player").pause();
							$('.vjs-loading-spinner').show();
							setTimeout(function(){
								$('.vjs-loading-spinner').hide();
								videojs("player").play();
							},10000);
						},3000)
					});
				}
			}
		});
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
		, trackListSelector: '#tracklist' 
		, backdropSelector: '.backdropimg' 
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
		, fadeClass: 'fadein' 
		, fadeSlowClass: 'fadeinslow' 
		, focusedClass: 'focused'
		, scrollingClass: 'scrolling'
	};

})(jQuery);