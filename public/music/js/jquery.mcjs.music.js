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
				$that: $that, 
				//interval : null
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			_setHeight();
			$(window).resize(function() {
				_setHeight();	
			});
			
			_focusedItem();
			_getMusicDetails();
			
			$('ul.music').find('li').click(function(e) {
				e.preventDefault();	
				
				$('ul.music').find('li').each(function(){
					if($('ul.music').find('li').hasClass('playing') || $('ul.music').find('li').hasClass('selected')){
						$('ul.music').find('li').removeClass('playing');
						$('ul.music').find('li').removeClass('selected');
					}
				});

				var album = $(this).find('.title').html();
				
				if(album.match(/\.[0-9a-z]{1,5}$/i)){
					var track = '/music/track/none/'+album
					, album = 'none';
				
					$(this).addClass('playing');
					$(this).addClass('selected');

					var image = $('.playing').find('img')
					 _dominantColor(image);
					
					_playTrack(track,album);
				}else {
					_getAlbum(album);
				}
			});

		});
	}
	
	/**** Start of custom functions ***/

	function _setHeight(){
		var viewportHeight = $(window).height();
		$('#musicWrapper').css('height',viewportHeight - 55);
		if($('#tracks')){
			$('#tracks').css('height',viewportHeight - 155);
		}
	}
	
	function _getMusicDetails(){
	
		if($("#player").hasClass('show')){
			$("#player").removeClass('show')
		};
	
		$('ul.music').find("li").each(function() { 
			var title = $(this).find('.title').html()
			, cover = $(this).find('.cover')
			, album = $(this);
			_handleMusic(title, cover, album);
		});
	}

	function _handleMusic(title, cover, album){
		$.ajax({
			url: '/music/post/', 
			type: 'post',
			data: {albumTitle : title}
		}).done(function(data){
			var albumData = $.parseJSON(data);
			album.addClass('coverfound')
			cover.attr('src','');	
			setTimeout(function(){
				cover.attr('src',albumData[0].thumb);
			},500);
		});
	}
	
	function _focusedItem(){
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
				$('#tracks').append('<li><div class="eq"><span class="bar"></span><span class="bar"></span><span class="bar"></span></div><div class="title">'+data[i]+'</div></li>')
			}	
			
			$(".bar").each(function() {
				_fluctuate($(this));
			});
			
			$.ajax({
				url: '/music/post/', 
				type: 'post',
				data: {albumTitle : album}
			}).done(function(data){
				var albumData = $.parseJSON(data);
				$('#tracklist').find('img.cover').attr('src',albumData[0].thumb);
				$('img.cover').bind('load', function (event) {
					var image = event.target;
					 _dominantColor(image);
				});		
			});
			
			
			$('#tracklist').find('li').click(function(e) {
				e.preventDefault();	
				var songTitle = $(this).find('.title').html();
				$('#tracklist').find('li').each(function(){
					if ($(this).hasClass('selected')){
						$(this).removeClass('selected');
					}
				});
				$(this).addClass('selected');
				var track = '/music/track/'+album+'/'+songTitle;

				_playTrack(track,album)
			});

		});	
	}
	
	function _hideOtherAlbums(){
		$('#musicWrapper').hide();
		$('.backlink').click(function(e) {
			if ($('#tracklist').is(':hidden')){	
				$(this).attr('href','/')
			} else if ($('#tracklist').is(':visible')) {	
				e.preventDefault();	
				//var play = false;
				//_fluctuate(o, play);
				
				// keeps the track playing but let's the user browse other albums
				$('#eq').css('height',1)
				
				//TODO: rewrite code so player continues playing while brwosing
				$('#tracklist').remove();
				$('body').removeClass('tracklist')
				$('#musicWrapper').fadeIn();
			}
		});
	}
	
	function _playTrack(track,album){
		$("#player").addClass('show');
		
		videojs("player").ready(function(){
			var myPlayer = this;
			myPlayer.src(track);
			myPlayer.play();
			
			myPlayer.on("ended", _nextTrack);
			
			myPlayer.on("play", function(){
			});

			myPlayer.on("pause", function(){
			});

		});
	}
	
	function _nextTrack(){
		var currentTrack = $('#tracklist').find('.selected').removeClass('selected')
		, nextTrack =	currentTrack.next().addClass('selected').find('.title').html()
		, album = $('#tracklist').find('h2').html()
		, track = '/music/track/'+album+'/'+nextTrack;

		if (nextTrack !== undefined){
			_playTrack(track,album)
		}else{
			return
		}
	}
	
	
	function _dominantColor(image){
		var dominantColor = getDominantColor(image);
		$('.bar').css('background','rgb('+dominantColor+')');
		$('#header').css('borderBottom','5px solid rgb('+dominantColor+')');
	}
	
	function _fluctuate(bar) {
		var barHeight = Math.random() * 10;
		barHeight += 1;
		var randomHeight = barHeight * 30;
		
		bar.animate({
			height: barHeight
		}, randomHeight, function() {
			_fluctuate($(this));
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