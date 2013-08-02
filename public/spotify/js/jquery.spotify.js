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

	var ns = 'spotify';
	var methods = {};

	function _init(options) {
		var opts = $.extend(true, {}, $.fn.spotify.defaults, options);
		return this.each(function() {
			var $that = $(this);
			var o = $.extend(true, {}, opts, $that.data(opts.datasetKey));
				
			// add data to the defaults (e.g. $node caches etc)	
			o = $.extend(true, o, { 
				$that: $that
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
			$('.search').keypress(function(e) {
				if(e.keyCode == 13) {
					e.preventDefault();
					if ($('#results').find('li').length > 1) $('#results').empty();
					_getTrack(o);
					return false;
				}
			});
			
			$('.stop').click(function(e) {
				console.log('Stop Playing')
				e.preventDefault();
				event = 'stopPlaying'
				$.ajax({
					url: '/spotify/file/stopPlaying', 
					type: 'get',
				}).done(function(data){
				
					
				});
			});			
			
			$('#searchWrapper').bind('submit', function(e) {
				if ($('#results').find('li').length > 1) $('#results').empty();
				_getTrack(o);
				return false;
			});

		});
	}
	
	/**** Start of custom functions ***/
	
	
	function _getTrack(o,track){
		var track = $('.search').attr('value');
		if(track !== undefined){
			$.ajax({
				url: '/spotify/post/', 
				type: 'post',
				data: {post : track}
			}).done(function(data){
				$(data.tracks).each(function(index, item){
					$('#results').append('<li><ul><li>Artitst: '+item.artists[0].name+'</li><li>Album: '+item.album.name+'</li><li></li><li><a class="play" href="'+item.href+'">play track</a><li></ul></li>');
				});
					
				$('.play').click(function(e) {
					e.preventDefault();
					var playSong = $(this).attr('href')
					, track = '/spotify/file/'+playSong;
					
					$.ajax({
						url: '/spotify/file/'+playSong, 
						type: 'get'
					}).done(function(data){
						console.log(data)
					});
				});
				
			});
		}		
	}
	

	/**** End of custom functions ***/
	
	$.fn.spotify = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || !method ) {
			return _init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.fn.spotify' );
		}
	};
	
	/* default values for this plugin */
	$.fn.spotify.defaults = {};

})(jQuery);