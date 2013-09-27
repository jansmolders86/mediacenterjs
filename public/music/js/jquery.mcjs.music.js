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
				$that : $that
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			_setHeight(o);
			$(window).resize(function() {
				_setHeight(o);	
			});
			
			$(o.musicListSelector).scroll( function(){
				_lazyload(o);
			});
			_lazyload(o);
			
			$(o.musicListSelector+' ul > li').on('click tap', function(e) {
				e.preventDefault();	
				
				$(o.musicListSelector+' ul > li').each(function(){
					if($(o.musicListSelector+' ul > li').hasClass(o.playingClass) || $(o.musicListSelector).find('li').hasClass(o.selectedClass)){
						$(o.musicListSelector+' ul > li').removeClass(o.playingClass);
						$(o.musicListSelector+' ul > li').removeClass(o.selectedClass);
					}
				});

				var album = $(this).find('.title').html();
				if(album.match(/\.[0-9a-z]{1,5}$/i)){
					var track = '/music/none/'+album+'/play'
					, album = 'none';
					$(this).addClass(o.playingClass).addClass(o.selectedClass);
					var image = $('.'+o.playingClass).find('img');
					_dominantColor(o,image);
					_playTrack(o,track,album);
				}else {
					_getAlbum(o, album);
				}
			});
			
			$(o.backLinkSelector).on('click tap',function(e) {
				e.preventDefault();	
				if ($(o.trackListSelector).is(':hidden')){	
					window.location = '/';
				} else if ($(o.trackListSelector).is(':visible')) {	
					$(o.trackListSelector).hide();
					$(o.musicListSelector).fadeIn();
				}
			});

		});
	}
	
	/**** Start of custom functions ***/

	function _setHeight(o){
		var viewportHeight = $(window).height();
		$(o.musicListSelector).css('height',viewportHeight - 55);
		$(o.trackListSelector).css('height',viewportHeight - 200);
	}
	
	function _lazyload(o){
		if($(o.playerSelector).hasClass('show')){
			$(o.playerSelector).removeClass('show')
		};
		//Set timeout for fast scrolling
		setTimeout(function(){
			var WindowTop = $(o.musicListSelector).scrollTop()
			, WindowBottom = WindowTop + $(o.musicListSelector).height();

			$(o.musicListSelector).find('li').each(function(){
				var offsetTop = $(this).offset().top
				, offsetBottom = offsetTop + $(this).height();

				if(!$(this).attr("loaded") && WindowTop <= offsetBottom && WindowBottom >= offsetTop){
					var title = $(this).find('.title').html()
					, cover = $(this).find('.cover')
					, album = $(this);
					
					_handleMusic(o, title, cover, album);
					$(this).attr("loaded",true);
				}
			});		
		},500);	
	}
	
	function _handleMusic(o, title, cover, album){
		$.ajax({
			url: '/music/'+title+'/info/', 
			type: 'get'
		}).done(function(data){
			var thumbnail	= data[0].cover;
			
			album.fadeIn();
			cover.attr('src','');	
			setTimeout(function(){
				cover.attr('src',thumbnail).addClass('coverfound');
			},500);
		});
	}
	
	function _focusedItem(o){
		$(o.musicListSelector+'ul > li').on({
			mouseenter: function() {	
				$(this).addClass(o.focusedClass);
			},
			mouseleave: function() {
				if ($(o.musicListSelector+'ul > li.'+o.focusedClass).length > 1){
					$(o.musicListSelector+'ul > li.'+o.focusedClass).removeClass(o.focusedClass);
				}
			},			
			focus: function() {				
				$(this).addClass(o.focusedClass);
			},
			focusout: function() {
				if ($(o.musicListSelector+'ul > li.'+o.focusedClass).length > 1){
					$(o.musicListSelector+'ul > li.'+o.focusedClass).removeClass(o.focusedClass);
				}
			}
		});	
	}
	
	function _getAlbum(o, album){	
		$.ajax({
			url: '/music/'+album+'/info/', 
			type: 'get'
		}).done(function(data){
		
			var thumbnail	= 	data[0].cover
			, year 			= 	data[0].year
			, genre 		= 	data[0].genre
			, tracks 		= 	data[0].tracks;
		
			$(o.trackListSelector).find('h2').html(album);

			if($(o.trackListSelector).find('ul').length == 0){
				$(o.trackListSelector).append('<ul id="tracks"></ul>')
			} else{
				$(o.trackListSelector).find('ul').remove();
				$(o.trackListSelector).append('<ul></ul>');
			}
			
			// Populate tracks
			tracks.forEach(function(value, index) {
				$(o.trackListSelector +' > ul').append('<li><div class="eq"><span class="bar"></span><span class="bar"></span><span class="bar"></span></div><div class="title">'+value+'</div></li>')
			});
			
			_presentTracks(o);

			$(window).resize(function() {
				_presentTracks(o);
			});
			
			$(o.musicListSelector).hide();
			$(o.trackListSelector).show();		
				
			// Styling
			$(o.trackListSelector).find('li:odd').addClass('odd');
			$(o.trackListSelector).find('img.cover').attr('src',thumbnail).addClass('coverfound');
			$(o.trackListSelector).find('.year').html(year);
			$(o.trackListSelector).find('.genre').html(genre);
			$('img.cover').bind('load', function (event) {
				var image = event.target;
				_dominantColor(o,image);
			});	
			
			// Play song init
			$(o.trackListSelector+' ul > li').on('click tap', function(e) {
				e.preventDefault();	
				var songTitle = $(this).find('.title').html();
				
				$(o.trackListSelector+' ul > li').each(function(){
					$(this).removeClass(o.selectedClass);
				});
				
				$(this).addClass(o.selectedClass);
				var track = '/music/'+album+'/'+songTitle+'/play/'
				, random = false;

				_playTrack(o,track,album,songTitle,random);
			});
		});			
	}
	
	function _presentTracks(o){
		var parentHeight = $(o.trackListSelector).height();
		$(o.trackListSelector+' > ul').css('height',parentHeight - 200).perfectScrollbar();
	}
	
	function _hideOtherAlbums(o){
		$(o.musicListSelector).hide();
	}
	
	function _playTrack(o,track,album,songTitle,random){
	
		$(o.playerSelector).addClass('show');
		$('li.'+o.selectedClass).find(".bar").each(function() {
			_fluctuate(o,$(this));
		});
		
		videojs(o.playerID).ready(function(){
			var myPlayer = this;

			myPlayer.src(track);
			myPlayer.play();
			
			$(".random").remove();
			$(o.playerSelector).append('<div class="random">Random</div>')
			
			$('.random').on('click tap', function(e) {
				_randomTrack(o);
			});
			
			myPlayer.on("pause", function(){
				$('.'+o.selectedClass+' > .eq').addClass('pause');
			});
			
			myPlayer.on("play", function(){
				$('.'+o.selectedClass+' > .eq').removeClass('pause');
			});
			
			myPlayer.on("ended", function(){
				if(random === false){
					_nextTrack(o,album,songTitle);
				} else if(random === true){
					_randomTrack(o);
				}
			});
		});
	}
	
	function _nextTrack(o,album,songTitle){		
		var random = false
		, currentSong = $('li'+o.selectedClass);
		
		currentSong.removeClass(o.selectedClas).next('li').addClass(o.selectedClas);
		
		var nextTrack = $('li'+o.selectedClass).find('.title').html()
		, album = $(o.trackListSelector).find('h2').html()
		, track = '/music/'+album+'/'+nextTrack+'/play';

		if (nextTrack !== undefined){
			_playTrack(track,album,songTitle, random);
		}else{
			return;
		}
	}
	
	function _randomTrack(o){
		$(o.trackListSelector).find('li').each(function(){
			$(this).removeClass(o.selectedClass);
		});
	
		var random = true
		, list = $(o.trackListSelector+'> ul > li').toArray()
		, elemLength = list.length
		, randomNum = Math.floor(Math.random()*elemLength)
		, randomItem = list[randomNum];
		
		$(randomItem).addClass(o.selectedClass);
		
		var nextTrack = $('.'+o.selectedClass).find('.title').html()
		, album = $(o.trackListSelector).find('h2').html()
		, track = '/music/'+album+'/'+nextTrack+'/play';
		
		_playTrack(o,track,album,random);
	}
	
	function _dominantColor(o,image){
		var dominantColor = getDominantColor(image);
		$('.bar').css('background','rgb('+dominantColor+')');
		$(o.headerSelector).css('borderBottom','5px solid rgb('+dominantColor+')');
	}
	
	function _fluctuate(o,bar) {
		var barHeight = Math.random() * 10;
		barHeight += 1;
		var randomHeight = barHeight * 30;
		
		bar.animate({
			height: barHeight
		}, randomHeight, function() {
			_fluctuate(o,$(this));
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
	$.fn.mcjsm.defaults = {
		datasetKey: 'mcjsmusic' //always lowercase
		, musicListSelector: '#musicWrapper' 
		, trackListSelector: '#tracklist' 
		, playerSelector: '#player' 
		, headerSelector: '#header' 
		, backLinkSelector: '.backlink' 
		, playerID: 'player' 
		, selectedClass: 'selected' 
		, focusedClass: 'focused' 
		, playingClass: 'playing' 
	};

})(jQuery);