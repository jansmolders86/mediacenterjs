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
			
			
			$('a.play').click(function(e) {
				e.preventDefault();	
				var url = '/movies/video/' + $(this).attr('data-movie')
				_playMovie(url)
			});
			
		});
	}
	
	/**** Start of custom functions ***/
	
	function _focusedItem(o){
		$('.movieposter').on({
			mouseenter: function() {	
				$('.movieposters').find("li:first").removeClass("focused");
				var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
				$(this).addClass("focused");
				$(".backdropimg").attr("src", newBackground).addClass('fadein');
				var currentMovieTitle = $(this).find('span.title').html();
				var currentMovie = $(this);
				_showDetails(o,currentMovie, currentMovieTitle);
			},
			mouseleave: function() {
				$(".backdropimg").removeClass("fadein");
				if ($('.movieposter.focused').length > 1){
					$('.movieposter').removeClass("focused");
				}
				var currentMovie = $(this);
				_hideDetails(currentMovie);
			},			
			focus: function() {				
				var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
				$(".backdropimg").attr("src", newBackground).addClass('fadein');
				
				var currentMovieTitle = $(this).find('.title');
				var currentMovie = $(this);
				_showDetails(o,currentMovie, currentMovieTitle);		
			},
			focusout: function() {
				$(".backdropimg").removeClass("fadein");
				var currentMovie = $(this);
				_hideDetails(currentMovie);
			}
		});	
		
		if ($('.movieposter.focused')){
			var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
			$(".backdropimg").attr("src", newBackground).addClass('fadeinslow');		
		} else if($('.movieposter.focused').length < 1){
			var currentMovie = $(this);
			_hideDetails(currentMovie);
		}		
	}
	

	// Needs plugin jquery.carouFredSel-6.1.0-packed.js
	//TODO: handle long key press to scroll faster
	function _carousel(o){
		//$('.movieposters').find(".movieposter:first").addClass("focused");
		$(".movieposter").each(function() { 
			var title = $(this).find('span.title').html();
			var visibleMovie = $(this);
			
			console.log('title',title)
			console.log('visibleMovie',visibleMovie)
			_handleVisibleMovies(o, title, visibleMovie);
		});
	}

	
	
	function _handleVisibleMovies(o, title, visibleMovie){
		$.ajax({
			url: '/movies/post/', 
			type: 'post',
			data: {movieTitle : title}
		}).done(function(data){
			var movieData = $.parseJSON(data);
			visibleMovie.find('.original_name').html(movieData[0].original_name);
			
			// Give the plugin time to load the (new) images.
			// Is need for chrome bug with image loading..
			
			setTimeout(function(){
				visibleMovie.find("img.movieposter").attr('src','');	
				visibleMovie.find("img.movieposter").attr('src',movieData[0].poster).addClass('coverfound');							
			},400);
			
			visibleMovie.find("img.movieposter").attr('data-backdrop',movieData[0].backdrop);
			
			if(movieData[0].cdNumber !== null){
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
			currentMovie.append('<div id="overview"><h1>'+movieData[0].original_name+'</h1><p>'+movieData[0].overview+'</p><p><strong> Genre:</strong> '+movieData[0].genre+'</p><p><strong> Runtime:</strong> '+movieData[0].runtime+' min</p></div>').addClass('showDetails fadein');;
		});
	}
	
	
	function _hideDetails(currentMovie){
		$('#overview').remove();
		currentMovie.removeClass('showDetails')
	}
	
	function _playMovie(url){
		$('#wrapper, #moviedetails, #backdrop').hide();
		$('body').css('backgroundColor','#000');
		$('body').append('<video id="player" class="video-js vjs-default-skin" style="position: absolute; top: 0; left:0px width:100%; height:100%; z-index:9;" controls poster="/movies/img/loading-video.png" width="100%" height="100%"><source src="'+url+'" type="video/webm"></video>');
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