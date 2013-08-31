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
				$that: $that
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
			_focusedItem(o);
			
			$("ul.movies li").sort(asc_sort).appendTo('ul.movies');
			function asc_sort(a, b){
				return ($(b).text()) < ($(a).text()) ? 1 : -1;    
			}

			$('body').scroll( function(){ _lazyload(o); });
			
			_lazyload(o);
			_scrollBackdrop();
			_showAndFilterAvailableGenres(o);
			
			$('.overlay').click(function(e) {
				e.preventDefault();	
				var movieTitle = $(this).attr('data-movie').replace(/.(avi|mkv|mpeg|mpg|mov|mp4|wmv|txt)/gi,"")
				, url = '/movies/'+movieTitle+'/play/';
				_playMovie(url);
			});
			
			$(window).scroll(function(){
				if($(this).scrollTop() > 200){
					$('#header').addClass('scrolling');   
				} else if ($(this).scrollTop() < 200){
					$('#nav').removeClass('scrolling');   
				}
			});
			
		});
	}
	
	/**** Start of custom functions ***/
	
	function _lazyload(o){
		//Set timeout for fast scrolling
		setTimeout(function(){
			var WindowTop = $('body').scrollTop()
			, WindowBottom = WindowTop + $('body').height();

			$(".movieposter").each(function(){
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
		$('.movieposter').on({
			mouseenter: function() {	
				var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
				$(this).addClass("focused");
				$(".backdropimg").attr("src", newBackground).addClass('fadein');
			},
			mouseleave: function() {
				$(".backdropimg").removeClass("fadein");
				if ($('.movieposter.focused').length > 1) $('.movieposter').removeClass("focused");
			},			
			focus: function() {		
				$(this).addClass("focused");			
				var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
				$(".backdropimg").attr("src", newBackground).addClass('fadein');
			},
			focusout: function() {
				$(".backdropimg").removeClass("fadein");
				if ($('.movieposter.focused').length > 1) $('.movieposter').removeClass("focused");
			}
		});	
		
		if ($('.movieposter.focused')){
			var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
			$(".backdropimg").attr("src", newBackground).addClass('fadeinslow');
		}
	}
	
	
	function _scrollBackdrop(){
		var duration = 40000
		$(".backdropimg").animate({ 
			top: '-380px'
		},
		{
			easing: 'swing',
			duration: duration,
			complete: function(){
				$(".backdropimg").animate({ 
					top: '-0px'
				},
				{
					easing: 'swing',
					duration: duration,
					complete: function(){
						_scrollBackdrop()
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
				setTimeout(function(){
					visibleMovie.find("img.movieposter").attr('src','');	
					visibleMovie.find("img.movieposter").attr('src',posterImage).addClass('coverfound');		
					visibleMovie.find('.overview').append('<h1>'+orginal_name+'</h1><p class="summary">'+overview+'</p>');
					
					if(orginal_name !== 'No data found...'){
						visibleMovie.find('.specs').append('<p><strong> Genre:</strong> '+genre+'</p><p><strong> Runtime:</strong> '+runtime+' min</p>');
					}
					visibleMovie.addClass('showDetails fadein');
				},400);
				
				visibleMovie.find("img.movieposter").attr('data-backdrop',backdropImage);
				
				if(cdNumber !== 'No data found...' && cdNumber !== undefined && cdNumber !== '') visibleMovie.append('<div class="cdNumber"><span>'+cdNumber+'</span><div>');
				
			});
		}		
	}
	
	function _showAndFilterAvailableGenres(o){
		$.ajax({
			url: '/movies/getGenres/', 
			type: 'get'
		}).done(function(data){
			if($('#genres').length == 0){
				$('#wrapper').append('<ul id="genres"></ul>')
			} else{
				$('#genres').remove();
				$('#wrapper').append('<ul id="genres"></ul>');
			}
			
			// Sort array and remove duplicates.
			data.sort();
			for ( var i = 1; i < data.length; i++ ) {
				if ( data[i] === data[ i - 1 ] ) data.splice( i--, 1 );
			}

			// Print sorted array
			data.forEach(function(value, index) {
				$('#genres').append('<li> <a href="'+value+'" class="genrelink">'+value+'</a></li>');
			});
			$('#genres').append('<li> <a href="" class="showAll">All movies</a></li>');
			
			$('.genrelink').click(function(e) {
				e.preventDefault();	
				var selectedGenre = $(this).attr('href')
				, filterUrl = '/movies/filter/'+selectedGenre;

				$.ajax({
					url: filterUrl,
					type: 'get'
				}).done(function(data){
					$('ul.movies').find('li').each(function(){ 
						$(this).remove();
					});
				
					$.each(data, function() {
						var title = $(this)[0].local_name;
						$('ul.movies').append('<li class="movieposter boxed"><img src="/core/css/img/ajax-loader.gif" class="movieposter"/><div class="overlay" data-movie="'+title+'"></div><span class="title">'+title+'</span><div class="overview"></div></li>');
					});
					
					$("ul.movies li").sort(asc_sort).appendTo('ul.movies');
					function asc_sort(a, b){
						return ($(b).text()) < ($(a).text()) ? 1 : -1;    
					}

					_lazyload(o);
				});
			});
			
			$('.showAll').click(function(e) {
				e.preventDefault();	
				window.location.href = '/movies';
			});
		});
	}
	
	function _playMovie(url){
		$.ajax({
			url: '/configuration/', 
			type: 'get'
		}).done(function(data){
			var myPlayer;
			$('#wrapper, #moviedetails, #backdrop, #header').hide();
			$('body').animate({backgroundColor: '#000'},500);
			
			if($('#player').length > 1) {
				$('#player').remove();
			} else {
				$('body').append('<video id="player" class="video-js vjs-default-skin" controls preload="both" width="100%" height="100%"><source src="'+url+'" type="video/mp4"></video>');
				videojs("player").ready(function(){
					myPlayer = this;
					myPlayer.play();
					myPlayer.on('error', function(e){ console.log('Error', e) });
					myPlayer.on('ended', function(e){ window.location="/movies/"; });
				});
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
	$.fn.mcjsm.defaults = {};

})(jQuery);