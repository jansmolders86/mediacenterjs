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
	,methods = {}

	function _init(options) {
		var opts = $.extend(true, {}, $.fn.mcjsm.defaults, options);
		return this.each(function() {
			var $that = $(this)
				,o = $.extend(true, {}, opts, $that.data(opts.datasetKey));
				
			// add data to the defaults (e.g. $node caches etc)	
			o = $.extend(true, o, { 
				$that: $that
				,movielocation 	: undefined
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
		//	_loadCache(o, $(this));
			_focusedItem(o, $(this));
			_carousel(o, $(this));
			
		});
	}
	
	/**** Start of custom functions ***/
	/**** MOVIE HANDELING *******/
	
	function _focusedItem(o, $that){
		// movie poster handlers 
		$('.movieposter').on({
			mouseenter: function() {	
				$('.movieposters').find("li:first").removeClass("focused");
				var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
				$(this).addClass("focused");
				$(".backdropimg").attr("src", newBackground).addClass('fadeinslow');

				var currentMovieTitle = $(this).find('span.title').html();
				_showDetails(o, currentMovieTitle);
			},
			mouseleave: function() {
				$(".backdropimg").removeClass("fadeinslow");
				if ($('.movieposter.focused').length > 1){
					$('.movieposter').removeClass("focused")
				};
				_hideDetails(o);
			},			
			focus: function() {				
				var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
				$(".backdropimg").attr("src", newBackground).addClass('fadeinslow');
				
				var currentMovieTitle = $(this).find('.title');
				_showDetails(o, currentMovieTitle);
			},
			focusout: function() {
				$(".backdropimg").removeClass("fadeinslow");
				_hideDetails(o);
			}
		});	
		
		if ($('.movieposter.focused')){
			var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
			$(".backdropimg").attr("src", newBackground).addClass('fadeinslow');
		} else if($('.movieposter.focused').length < 1){
			_hideDetails(o);
		}		
	};
	

	// Movie poster carousel - Needs plugin jquery.carouFredSel-6.1.0-packed.js
	function _carousel(o, $that){
		console.log('carousel')
		$('.movieposters').find(".movieposter:first").addClass("focused");
		$('.movieposters').carouFredSel({
			auto: false,
			onCreate: function( data ) {
				data.items.each(function() { 
					var title = $(this).find('span.title').html();
					var visibleMovie = $(this) 
					_handleVisibleMovies(o, title, visibleMovie)
				});
			},
			scroll  : {
				onBefore : function (){
					$("#moviedetails").animate({
						right:-6000
					});
				},
				onAfter : function( data ) {
					data.items.visible.each(function() { 
						var title = $(this).find('span.title').html();
						var visibleMovie = $(this) 
						_handleVisibleMovies(o, title, visibleMovie )
					});
				}
			},
			prev: {
				key : "left",
				button : "#prev",
			},
			next: {
				key : "right",
				button : "#next",
			},
			scroll      : {
				fx : "scroll",
				easing  : "swing",
			},
			mousewheel: true,
			swipe: {
				onMouse: true,
				onTouch: true,
				fx : "scroll",
				easing  : "swing",
			}
		});
	};

	
	
	function _handleVisibleMovies(o, title, visibleMovie){
		// Post the movie to the sever so we get data back
		// we can use to fill the movie specifications
		$.ajax('/movies/post/', {
			type: 'post',
			data: {movieTitle : title},
			success: function(data) { 
				var movieData = $.parseJSON(data);
				visibleMovie.find('.original_name').html(movieData[0].original_name) 
				
				// Give the plugin time to load the (new) image(s).
				// Is need for chrome bug with image loading..
				
				setTimeout(function(){
					visibleMovie.find("img.movieposter").attr('src','');	
					visibleMovie.find("img.movieposter").attr('src',movieData[0].poster).addClass('coverfound');							
				},350);
				visibleMovie.find("img.movieposter").attr('data-backdrop',movieData[0].backdrop);
				if(movieData[0].cdNumber != null){
					if($('.cdNumber').length < 1){
						visibleMovie.find("> a.play").append('<div class="cdNumber"><span>'+movieData[0].cdNumber+'</span><div>');
					};
				};
			},
			error  : function(data) {
				console.log('e', data);
			};
		});
	};	
	
	function _showDetails(o, currentMovieTitle){
		$.ajax('/movies/data/'+currentMovieTitle+'/data.js', {
			type: 'get',
			success: function(data) { 
				var movieData = $.parseJSON(data);
				setTimeout(function(){
					$('body').append('<div id="moviedetails"><div id="overview"></div></div>');
					$('#moviedetails').append('<div id="overview"><h1>'+movieData[0].original_name+'</h1><p>'+movieData[0].overview+'</p></div><div id="additional"><div id="genre"><p> Genre: '+movieData[0].genre+'</p></div><div id="runtime"><p> Runtime: '+movieData[0].runtime+'</p></div></div>');
					$("#moviedetails").animate({opacity:1});
					//TODO: Add settings to be able to manage the timeout
				},2000);
			},
			error  : function(data) {
				console.log('e', data);
			};
		});
	};
	
	function _hideDetails(o){
		$("#moviedetails").animate({opacity:0});
		$('#moviedetails').remove();
	};

	/**** End of custom functions ***/
	
	$.fn.mcjsm = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || !method ) {
			return _init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.fn.mcjsm' );
		};
	};
	
	/* default values for this plugin */
	$.fn.mcjsm.defaults = {}

})(jQuery);