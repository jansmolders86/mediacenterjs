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
			
			_carousel(o);
			
			$('ul.music').find('li').click(function(e) {
				e.preventDefault();	
				var url = $(this).find('.title').html();
				_getAlbum(url)
			});
			
		});
	}
	
	/**** Start of custom functions ***/


	// Needs plugin jquery.carouFredSel-6.1.0-packed.js
	//TODO: handle long key press to scroll faster
	function _carousel(o){
		$('ul.music').find(".li:first").addClass("focused");
		$('ul.music').carouFredSel({
			auto: false,
			height:700, 
			onCreate: function( data ) {
				data.items.each(function() { 
					var title = $(this).find('.title').html();
					var visibleMovie = $(this);
					_handleVisibleMovies(o, title, visibleMovie);
				});
			},
			direction   : "up",
			scroll  : {
				onAfter : function( data ) {
					data.items.visible.each(function() { 
						var title = $(this).find('.title').html();
						var visibleMovie = $(this);
						_handleVisibleMovies(o, title, visibleMovie );
					});
				},
				fx : "scroll",
				easing  : "swing",
				items: 1
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
		console.log(title)
		$.ajax({
			url: '/music/post/', 
			type: 'post',
			data: {albumTitle : title}
		}).done(function(data){
			var albumData = $.parseJSON(data);
			visibleMovie.find("img").attr('src','');	
			visibleMovie.find("img").attr('src',albumData[0].thumb).addClass('coverfound');
		});
	}
	
	function _getAlbum(url){
		console.log('getting album info', url)
		$.ajax({
			url: '/music/getAlbum/', 
			type: 'get',
			data: {album : url}
		}).done(function(data){
			var albumData = $.parseJSON(data);
			console.log('ertert',albumData)
		//	$('body').append('<video id="player" class="video-js vjs-default-skin" style="position: absolute; top: 0; left:0px width:100%; height:100%; z-index:9;" controls poster="/movies/img/loading-video.png" width="100%" height="100%"><source src="'+url+'" type="video/webm"></video>');
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