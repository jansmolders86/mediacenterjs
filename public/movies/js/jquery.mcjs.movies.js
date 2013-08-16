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

			$('body').scroll( function(){ _lazyload(o); });
			
			_lazyload(o);
			_scrollBackdrop();
			
			$('.overlay').click(function(e) {
				e.preventDefault();	
				var movieTitle = $(this).attr('data-movie').replace(/.(avi|mkv|mpeg|mpg|mov|mp4|wmv|txt)/gi,"")
				, url = '/movies/'+movieTitle+'/play/';
				_playMovie(url);
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
			top: '-490px'
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
				, cdNumber 		= movieData.cdNumber;
				
				visibleMovie.find('.original_name').html(orginal_name);
				
				// Give the plugin time to load the (new) images.
				// Is need for chrome bug with image loading..
				setTimeout(function(){
					visibleMovie.find("img.movieposter").attr('src','');	
					visibleMovie.find("img.movieposter").attr('src',posterImage).addClass('coverfound');		
					/*<p class="summary">'+overview+'</p>*/
					visibleMovie.find('.overview').append('<h1>'+orginal_name+'</h1><p><strong> Genre:</strong> '+genre+'</p><p><strong> Runtime:</strong> '+runtime+' min</p>');
					visibleMovie.addClass('showDetails fadein');
				},400);
				
				visibleMovie.find("img.movieposter").attr('data-backdrop',backdropImage);
				
				if(cdNumber !== null && cdNumber !== 0) visibleMovie.append('<div class="cdNumber"><span>'+cdNumber+'</span><div>');
			});
		}		
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
				$('body').append('<video id="player" class="video-js vjs-default-skin" controls preload="auto" width="100%" height="100%" data-setup="{"techOrder": ["flash"]}" > <source src="'+url+'" type="video/flv"></video>');
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