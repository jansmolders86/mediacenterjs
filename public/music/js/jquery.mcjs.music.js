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
			
			_getMusicDetials(o);
			
			$('ul.music').find('li').click(function(e) {
				e.preventDefault();	
				$(this).addClass('selected');
				var album = $(this).find('.title').html();
				
				if(album.match(/\.[0-9a-z]{1,5}$/i)){
					var track = '/music/track/none/'+album
					, album = 'none';
					_hideOtherAlbums();
					_playTrack(track,album)
				}else {
					_getAlbum(album);
				}
			});
			
		});
	}
	
	/**** Start of custom functions ***/

	function _getMusicDetials(o){
		$('ul.music').find("li").each(function() { 
			var title = $(this).find('.title').html();
			var cover = $(this).find('.cover');
			_handleMusic(o, title, cover);
		});
	}

	function _handleMusic(o, title, cover){
		console.log(title)
		$.ajax({
			url: '/music/post/', 
			type: 'post',
			data: {albumTitle : title}
		}).done(function(data){
			var albumData = $.parseJSON(data);
			cover.attr('src','');	
			cover.attr('src',albumData[0].thumb).addClass('coverfound');
		});
	}
	
	function _getAlbum(album){
		$.ajax({
			url: '/music/album/', 
			type: 'post',
			data: {album : album}
		}).done(function(data){
			_hideOtherAlbums();
			$('body').append('<div id="tracklist"><h2>'+album+'</h2><ul id="tracks"></ul></div>')
			
			for (var i = 0; i < data.length; i++) {
				$('#tracks').append('<li>'+data[i]+'</li>')
			}	
			
			$('#tracklist').find('li').click(function(e) {
				e.preventDefault();	
				var track = '/music/track/'+album+'/'+$(this).html();
				_playTrack(track,album)
			});
			
		});	
	}
	
	function _hideOtherAlbums(){
		$('#musicWrapper, #prev, #next').hide();
		$('.backlink').attr('href','/music')
	}
	
	function _playTrack(track,album){
		if($('#player').length) $('#player').remove();
		$('body').append('<video id="player" class="video-js vjs-default-skin" style="position: absolute; bottom: 20px; left:0px width:200px; height:200px; z-index:9;" controls poster="/movies/img/loading-video.png" ><source src="'+track+'" type="audio/ogg"></video>');
	}

	
	function _colorBackground(){
		//TODO: Color background according to albumArt
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