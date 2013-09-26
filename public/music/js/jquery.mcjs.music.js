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
				$that		: $that
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			_setHeight();
			$(window).resize(function() {
				_setHeight();	
			});
			
			$('#musicWrapper').scroll( function(){
				_lazyload(o);
			});
			_lazyload(o);
			
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
					var track = '/music/none/'+album+'/play'
					, album = 'none';
				
					$(this).addClass('playing');
					$(this).addClass('selected');

					var image = $('.playing').find('img');
					_dominantColor(image);
					_playTrack(track,album);
				}else {
					_getAlbum(o, album);
				}
			});
			
			$('.backlink').on('click',function(e) {
				e.preventDefault();	
				if ($('#tracklist').is(':hidden')){	
					window.location = '/';
				} else if ($('#tracklist').is(':visible')) {	
					$('#tracklist').hide();
					$('#musicWrapper').fadeIn();
				}
			});

		});
	}
	
	/**** Start of custom functions ***/

	function _setHeight(){
		var viewportHeight = $(window).height();
		$('#musicWrapper').css('height',viewportHeight - 55);
		$('#tracklist').css('height',viewportHeight - 200);
	}
	
	function _lazyload(o){
		if($("#player").hasClass('show')){
			$("#player").removeClass('show')
		};
		//Set timeout for fast scrolling
		setTimeout(function(){
			var WindowTop = $('#musicWrapper').scrollTop()
			, WindowBottom = WindowTop + $('#musicWrapper').height();

			$('ul.music').find("li").each(function(){
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
	
	function _getAlbum(o, album){	
		$.ajax({
			url: '/music/'+album+'/info/', 
			type: 'get'
		}).done(function(data){
		
			var thumbnail	= 	data[0].cover
			, year 			= 	data[0].year
			, genre 		= 	data[0].genre
			, tracks 		= 	data[0].tracks;
		
			$('#tracklist').find('h2').html(album);
			$('#tracks').find('h2').html(album);

			if($('#tracks').length == 0){
				$('#tracklist').append('<ul id="tracks"></ul>')
			} else{
				$('#tracks').remove();
				$('#tracklist').append('<ul id="tracks"></ul>');
			}
			
			// Populate tracks
			tracks.forEach(function(value, index) {
				$('#tracks').append('<li><div class="eq"><span class="bar"></span><span class="bar"></span><span class="bar"></span></div><div class="title">'+value+'</div></li>')
			});
			
			_presentTracks();

			$(window).resize(function() {
				_presentTracks();
			});
			
			$('#musicWrapper').hide();
			$('#tracklist').show();		
				
			// Styling
			$('#tracks').find('li:odd').addClass('odd');
			$('#tracklist').find('img.cover').attr('src',thumbnail).addClass('coverfound');
			$('#tracklist').find('.year').html(year);
			$('#tracklist').find('.genre').html(genre);
			$('img.cover').bind('load', function (event) {
				var image = event.target;
				_dominantColor(image);
			});	
			
			// Play song init
			$('#tracks > li').on('click', function(e) {
				e.preventDefault();	
				var songTitle = $(this).find('.title').html();
				
				$('#tracklist').find('li').each(function(){
					$(this).removeClass('selected');
				});
				
				$(this).addClass('selected');
				var track = '/music/'+album+'/'+songTitle+'/play/'
				, random = false;

				_playTrack(track,album,songTitle,random);
			});
		});			
	}
	
	function _presentTracks(){
		var parentHeight = $('#tracklist').height();
		$('#tracks').css('height',parentHeight - 200);
		$('#tracks').perfectScrollbar();
	}
	
	function _hideOtherAlbums(){
		$('#musicWrapper').hide();
	}
	
	function _playTrack(track,album,songTitle,random){
	
		$("#player").addClass('show');
		$('li.selected').find(".bar").each(function() {
			_fluctuate($(this));
		});
		
		videojs("player").ready(function(){
			var myPlayer = this;

			myPlayer.src(track);
			myPlayer.play();
			
			$(".random").remove();
			$("#player").append('<div class="random">Random</div>')
			
			$('.random').click(function(e) {
				_randomTrack();
			});
			
			myPlayer.on("pause", function(){
				$('.selected > .eq').addClass('pause');
			});
			
			myPlayer.on("play", function(){
				$('.selected > .eq').removeClass('pause');
			});
			
			myPlayer.on("ended", function(){
				if(random === false){
					_nextTrack(album,songTitle);
				} else if(random === true){
					_randomTrack();
				}
			});
		});
	}
	
	function _nextTrack(album,songTitle){		
		var random = false
		, currentSong = $('li.selected');
		
		currentSong.removeClass('selected').next('li').addClass('selected');
		
		var nextTrack = $('.selected').find('.title').html()
		, album = $('#tracklist').find('h2').html()
		, track = '/music/'+album+'/'+nextTrack+'/play';

		if (nextTrack !== undefined){
			_playTrack(track,album,songTitle, random);
		}else{
			return;
		}
	}
	
	function _randomTrack(){
		$('#tracklist').find('li').each(function(){
			$(this).removeClass('selected');
		});
	
		var random = true
		, list = $("#tracks li").toArray()
		, elemLength = list.length
		, randomNum = Math.floor(Math.random()*elemLength)
		, randomItem = list[randomNum];
		
		$(randomItem).addClass('selected');
		
		var nextTrack = $('.selected').find('.title').html()
		, album = $('#tracklist').find('h2').html()
		, track = '/music/'+album+'/'+nextTrack+'/play';
		
		_playTrack(track,album,random);
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