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
			var title = $(this).find('.title').html()
			, cover = $(this).find('.cover')
			, album = $(this);
			_handleMusic(o, title, cover, album);
		});
	}

	function _handleMusic(o, title, cover, album){
		$.ajax({
			url: '/music/post/', 
			type: 'post',
			data: {albumTitle : title}
		}).done(function(data){
			var albumData = $.parseJSON(data);
			album.addClass('coverfound')
			cover.attr('src','');	
			cover.attr('src',albumData[0].thumb);
		});
	}
	
	function _focusedItem(o){
		$('ul.music').find('li').on({
			mouseenter: function() {	
				$(this).addClass("focused");
			},
			mouseleave: function() {
				if ($('.movieposter.focused').length > 1){
					$('.movieposter').removeClass("focused");
				}
			},			
			focus: function() {				
				$(this).addClass("focused");
			},
			focusout: function() {
				if ($('.movieposter.focused').length > 1){
					$('.movieposter').removeClass("focused");
				}
			}
		});	
	}
	
	function _getAlbum(album){
		$.ajax({
			url: '/music/album/', 
			type: 'post',
			data: {album : album}
		}).done(function(data){
			_hideOtherAlbums();

			$('body').append('<div id="tracklist"><div class="info"><img src="" class="cover"/></div><h2>'+album+'</h2><ul id="tracks"></ul></div>').addClass('tracklist')
			
			for (var i = 0; i < data.length; i++) {
				$('#tracks').append('<li>'+data[i]+'</li>')
			}	
			
			$.ajax({
				url: '/music/post/', 
				type: 'post',
				data: {albumTitle : album}
			}).done(function(data){
				var albumData = $.parseJSON(data);
				$('#tracklist').find('img.cover').attr('src',albumData[0].thumb);
				
								
				$('.cover').bind('load', function (event) {
					//var dominantColor = getDominantColor('.cover')
					//console.log(dominantColor);
					//TODO: Make local images before being able to use this
				});
			});
			
			
			$('#tracklist').find('li').click(function(e) {
				e.preventDefault();	
				var track = '/music/track/'+album+'/'+$(this).html();
				_playTrack(track,album)
			});

		});	
	}
	
	function _hideOtherAlbums(){
		$('#musicWrapper').hide();
		$('.backlink').attr('href','/music')
	}
	
	function _playTrack(track,album){
		if($('#player').length) $('#player').remove();
		$('body').append('<audio id="player" class="video-js vjs-default-skin" controls preload="auto" width="100%" height="35" poster="" data-setup="{}"> <source src="'+track+'" type="audio/mp3"></audio>');

		videojs("player").ready(function(){
			var myPlayer = this;
			myPlayer.play();
			myPlayer.on("ended", nextTrack);
		});
	}
	
	function nextTrack(){
		var currentTrack = $('ul.music').find('.selected');
		currentTrack.removeClass('selected');
		
		var nextTrack =	currentTrack.next().addClass('selected');
		
		var album = nextTrack.find('.title').html();
		
		if(album.match(/\.[0-9a-z]{1,5}$/i)){
			var track = '/music/track/none/'+album
			, album = 'none';
			_playTrack(track,album)
		}else {
			var track = '/music/track/'+album+'/'+$(this).html();
			_playTrack(track,album)
		}
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