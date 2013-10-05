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
	var methods = {};

	function _init(options) {
		var opts = $.extend(true, {}, $.fn.mcjsm.defaults, options);
		return this.each(function() {
			var $that = $(this);
			var o = $.extend(true, {}, opts, $that.data(opts.datasetKey));
				
			// add data to the defaults (e.g. $node caches etc)	
			o = $.extend(true, o, { 
				$that: $that,
				platform : 'browser',
				viewModel : {}
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
			_focusedItem(o);
			
			$(o.movieListSelector+"> li").sort(asc_sort).appendTo(o.movieListSelector);
			
			function asc_sort(a, b){
				return ($(b).text()) < ($(a).text()) ? 1 : -1;    
			}

			$('body').scroll( function(){ 
				_lazyload(o);
			});
			
			_loadItems(o);
			
			_lazyload(o);
			_scrollBackdrop(o);
			_showAndFilterAvailableGenres(o);
			
			$(window).scroll(function(){
				if($(this).scrollTop() > 200){
					$(o.headerSelector).addClass(o.scrollingClass);   
				} else if ($(this).scrollTop() < 200){
					$(o.headerSelector).removeClass(o.scrollingClass);   
				}
			});
			
		});
	}
	
	/**** Start of custom functions ***/
	
	function _loadItems(o){
		$.ajax({
			url: '/movies/loadItems', 
			type: 'get',
			dataType: 'json'
		}).done(function(data){	
			console.log(data);
			o.viewModel = ko.observableArray(data);
			ko.applyBindings(o.viewModel,o.$that[0]);
			
				
			//TODO: make ko click
			$(o.overlayselector).on('click tap',function(e) {
				e.preventDefault();	
				var movieTitle = $(this).attr('title');
				
				if( navigator.platform === 'iPad' || navigator.platform === 'iPhone' || navigator.platform === 'iPod' ){
					o.platform = 'ios';
					var url = '/movies/'+movieTitle+'/play/ios';
				} else if(navigator.userAgent.toLowerCase().indexOf("android") > -1){
					o.platform = 'android';
					var url = '/movies/'+movieTitle+'/play/android';
				}else {
					var url = '/movies/'+movieTitle+'/play';
				}	
				
				_playMovie(o, url);
			});
			
		});	
	}
	
	function _lazyload(o){
		//Set timeout for fast scrolling
		setTimeout(function(){
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
						_handleVisibleMovies(o, movieTitle, visibleMovie);
					}
					$(this).attr("loaded",true);
				}
			});	
		},500);
	}
	
	function _focusedItem(o){
		$(o.movieListSelector+' > li').live({
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

	
	function _handleVisibleMovies(o, title, visibleMovie){
		var url = '/movies/'+title+'/info';
		if(title !== undefined){
			$.ajax({
				url: url, 
				type: 'get'
			}).done(function(data){
				var movieData 	= data[0]
				, orginal_name 	= movieData.original_name
				, posterImage 	= movieData.poster_path
				, backdropImage = movieData.backdrop_path
				, genre 		= movieData.genre
				, runtime 		= movieData.runtime
				, overview 		= movieData.overview
				, cdNumber 		= movieData.cd_number;

				// Give the plugin time to load the (new) images.
				// Is need for chrome bug with image loading..
				
				//TODO: load with ko
				setTimeout(function(){
					visibleMovie.find("img."+o.posterClass).attr('src','');	
					visibleMovie.find("img."+o.posterClass).attr('src',posterImage).addClass('coverfound');		
					visibleMovie.find('.overview').append('<h1>'+orginal_name+'</h1><p class="summary">'+overview+'</p>');
					
					if(orginal_name !== 'No data found...'){
						visibleMovie.find('.specs').append('<p><strong> Genre:</strong> '+genre+'</p><p><strong> Runtime:</strong> '+runtime+' min</p>');
					}
					visibleMovie.addClass('showDetails '+o.fadeClass);
				},400);
				
				visibleMovie.find("img."+o.posterClass).attr(o.backdrophandler,backdropImage);
				
				if(cdNumber !== 'No data found...' && cdNumber !== undefined && cdNumber !== '') {
					visibleMovie.append('<div class="cdNumber"><span>'+cdNumber+'</span><div>');
				}
				
			});
		}		
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
					$(o.movieListSelector).find('li').each(function(){ 
						$(this).remove();
					});
				
					$.each(data, function() {
						var movieData 	= $(this)[0]
						, local_name 	= movieData.local_name
						
						$(o.movieListSelector).append('<li class="'+o.posterClass+' boxed"><div class="imageWrapper"><img src="/core/css/img/ajax-loader.gif" '+o.backdrophandler+' class="'+o.posterClass+'"/></div><div class="overlay" data-movie="'+local_name+'"></div><span class="title">'+local_name+'</span><div class="overview"></div><div class="specs"></div></li>');
					});
					
					$(o.movieListSelector+'>li').sort(asc_sort).appendTo(o.movieListSelector);
					function asc_sort(a, b){
						return ($(b).text()) < ($(a).text()) ? 1 : -1;    
					}
					
					_focusedItem(o);
					_lazyload(o);

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
			url: '/configuration/', 
			type: 'get'
		}).done(function(data){
			var myPlayer;
			$(o.wrapperSelector+','+o.headerSelector+','+o.movieListSelector+','+o.backdropWrapperSelector).hide();
			$('body').animate({backgroundColor: '#000'},500);
			
			if($(o.playerSelector).length > 1) {
				$(o.playerSelector).remove();
			} else {
				if(o.platform === 'android' || o.platform === 'ios'){
					$('body').append('<video id="'+o.playerID+'" controls width="100%" height="100%"></video>');
					
					var myVideo = document.getElementsByTagName('video')[0];
					myVideo.src = url;
					myVideo.load();
					myVideo.play();
					myVideo.onended = function(e){window.location="/movies/";}
					
				} else if(o.platform === 'browser'){
					$('body').append('<video id="'+o.playerID+'" class="video-js vjs-default-skin" controls preload="auto" width="100%" height="100%" data-setup="{"techOrder": ["flash"]}" > <source src="'+url+'" type="video/flv"></video>');

					videojs(o.playerID).ready(function(){
						myPlayer = this;
						myPlayer.play();
						myPlayer.on('error', function(e){ console.log('Error', e) });
						myPlayer.on('ended', function(e){ window.location="/movies/"; });
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
		, backdrophandler: 'data-backdrop' 
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