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
			_loadMovies(o);
			
			$('.overlay').click(function(e) {
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
				
				_scrollBackdrop();
			},
			mouseleave: function() {
				$(".backdropimg").removeClass("fadein");
				if ($('.movieposter.focused').length > 1){
					$('.movieposter').removeClass("focused");
				}
			},			
			focus: function() {				
				var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
				$(".backdropimg").attr("src", newBackground).addClass('fadein');
				
				_scrollBackdrop();
			},
			focusout: function() {
				$(".backdropimg").removeClass("fadein");
			}
		});	
		
		if ($('.movieposter.focused')){
			var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
			$(".backdropimg").attr("src", newBackground).addClass('fadeinslow');
			
			_scrollBackdrop();
		} 	
	}
	

	function _loadMovies(o){
		$(".movieposter").each(function() { 
			var title = $(this).find('span.title').html();
			var visibleMovie = $(this);
			_handleVisibleMovies(o, title, visibleMovie);
		});
	}
	
	function _scrollBackdrop(){
		if($(".backdropimg").attr('src') !== '/movies/img/backdrop.jpg'){
			setTimeout(function(){
				$(".backdropimg").animate({marginTop:'-490px'}, 80000, 'linear');
				if($(".backdropimg").css({marginTop:'-490px'})){
					$(".backdropimg").animate({marginTop:'0px'}, 80000, 'linear');
				}
			},3000);
		}
	}

	
	function _handleVisibleMovies(o, title, visibleMovie){
		if(title !== undefined){
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
					/*<p class="summary">'+movieData[0].overview+'</p>*/
					visibleMovie.find('.overview').append('<h1>'+movieData[0].original_name+'</h1><p><strong> Genre:</strong> '+movieData[0].genre+'</p><p><strong> Runtime:</strong> '+movieData[0].runtime+' min</p>');
					visibleMovie.addClass('showDetails fadein');
				},400);
				
				visibleMovie.find("img.movieposter").attr('data-backdrop',movieData[0].backdrop);
				
				if(movieData[0].cdNumber !== null){
					visibleMovie.find("> a.play").append('<div class="cdNumber"><span>'+movieData[0].cdNumber+'</span><div>');
				}
			});
		}		
	}
	
	function _playMovie(url){
		var myPlayer
		$('#wrapper, #moviedetails, #backdrop, #header').hide();
		$('body').css('backgroundColor','#000');
		$('body').find('#player').addClass('active');
		
		// Init player
		if($('#player').length) $('#player').remove();
		$('body').append('<video id="player" class="video-js vjs-default-skin" controls preload="metadata" width="100%" height="100%" data-setup="{}"> <source src="'+url+'" type="video/webm"></video>');
	
		_V_("player").ready(function(){
			myPlayer = this
		});
		/*
		myPlayer.on("loadedmetadata", function(){
		  console.log('loadedmetadata',this.loadedmetadata());
		});
		*/
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