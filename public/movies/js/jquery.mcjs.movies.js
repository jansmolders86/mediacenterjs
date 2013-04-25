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
			o = $.extend(true, o, { $that: $that, movielocation: undefined});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
			_focusedItem(o);
			_carousel(o);
			
		});
	}
	
	/**** Start of custom functions ***/
	/**** MOVIE HANDELING *******/
	
	function _focusedItem(o){
		// movie poster handlers 
		$('.movieposter').on({
			mouseenter: function() {	
				$('.movieposters').find("li:first").removeClass("focused");
				var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
				$(this).addClass("focused");
				$(".backdropimg").attr("src", newBackground).addClass('fadeinslow');
				var currentMovieTitle = $(this).find('span.title').html();
				var currentMovie = $(this);
				_showDetails(o,currentMovie, currentMovieTitle);
	
				$(this).find('a.play').click( function(e) {
					e.preventDefault();
					_playmovie(o, currentMovieTitle);
				});
			},
			mouseleave: function() {
				$(".backdropimg").removeClass("fadeinslow");
				if ($('.movieposter.focused').length > 1){
					$('.movieposter').removeClass("focused");
				}
				
				var currentMovie = $(this);
				_hideDetails(currentMovie);
			},			
			focus: function() {				
				var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
				$(".backdropimg").attr("src", newBackground).addClass('fadeinslow');
				
				var currentMovieTitle = $(this).find('.title');
				var currentMovie = $(this);
				_showDetails(o,currentMovie, currentMovieTitle);
				
				$(this).find('a.play').click( function(e) {
					e.preventDefault();
					_playmovie(o, currentMovieTitle);
				});				
			},
			focusout: function() {
				$(".backdropimg").removeClass("fadeinslow");
				var currentMovie = $(this);
				_hideDetails(currentMovie);
			}
		});	
		
		if ($('.movieposter.focused')){
			var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
			$(".backdropimg").attr("src", newBackground).addClass('fadeinslow');
			
			$(this).find('a.play').click( function(e) {
				e.preventDefault();
				_playmovie(o, currentMovieTitle);
			});			
		} else if($('.movieposter.focused').length < 1){
			var currentMovie = $(this);
			_hideDetails(currentMovie);
		}		
	}
	

	// Movie poster carousel - Needs plugin jquery.carouFredSel-6.1.0-packed.js
	function _carousel(o){
		$('.movieposters').find(".movieposter:first").addClass("focused");
		$('.movieposters').carouFredSel({
			auto: false,
			onCreate: function( data ) {
				data.items.each(function() { 
					var title = $(this).find('span.title').html();
					var visibleMovie = $(this);
					_handleVisibleMovies(o, title, visibleMovie);
				});
			},
			scroll  : {
				onBefore : function (){
					_hideDetails();
				},
				onAfter : function( data ) {
					data.items.visible.each(function() { 
						var title = $(this).find('span.title').html();
						var visibleMovie = $(this);
						_handleVisibleMovies(o, title, visibleMovie );
					});
				},
				fx : "scroll",
				easing  : "swing"
			},
			prev: {
				key : "left",
				button : "#prev"
			},
			next: {
				key : "right",
				button : "#next"
			},
			mousewheel: true,
			swipe: {
				onMouse: true,
				onTouch: true,
				fx : "scroll",
				easing  : "swing"
			}
		});
	}

	
	
	function _handleVisibleMovies(o, title, visibleMovie){
		$.ajax({
			url: '/movies/post/', 
			type: 'post',
			data: {movieTitle : title, type : 'show'}
		}).done(function(data){
			var movieData = $.parseJSON(data);
			visibleMovie.find('.original_name').html(movieData[0].original_name);
			
			// Give the plugin time to load the (new) image(s).
			// Is need for chrome bug with image loading..
			
			setTimeout(function(){
				visibleMovie.find("img.movieposter").attr('src','');	
				visibleMovie.find("img.movieposter").attr('src',movieData[0].poster).addClass('coverfound');							
			},350);
			
			visibleMovie.find("img.movieposter").attr('data-backdrop',movieData[0].backdrop);
			
			if(movieData[0].cdNumber !== null && $('.cdNumber').length < 1){
				visibleMovie.find("> a.play").append('<div class="cdNumber"><span>'+movieData[0].cdNumber+'</span><div>');
			}
		});
	}
	
	
	
	function _showDetails(o, currentMovie, currentMovieTitle){
		$.ajax({
			url: '/movies/data/'+currentMovieTitle+'/data.js', 
			type: 'get'
		}).done(function(data){
			var movieData = $.parseJSON(data);
			setTimeout(function(){
				$('body').append('<div id="moviedetails"><div id="overview"><h1>'+movieData[0].original_name+'</h1><p>'+movieData[0].overview+'</p></div><div id="additional"><div id="genre"><p> Genre: '+movieData[0].genre+'</p></div><div id="runtime"><p> Runtime: '+movieData[0].runtime+'</p></div></div></div>');
				$("#moviedetails").animate({opacity:1});
			},1000);
		});
		
		currentMovie.find('.original_name').animate({opacity:1});
	}
	
	
	
	function _hideDetails(currentMovie){
		$("#moviedetails").animate({opacity:0});
		currentMovie.find('.original_name').animate({opacity:0});
		$('#moviedetails').remove();
	}
	
	function _playmovie(o, title){
		//TODO: Add nice curtain like animation (black divs from side to side closing into eachother)
		$.ajax({
			url: '/movies/post/', 
			type: 'post',
			data: {movieTitle : title, type : 'play'}
		}).done(function(data){
			$('#moviebrowser').hide();
			console.log(data)
			//$('#wrapper').append('<embed src="http://localhost:3000" id="player">');
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