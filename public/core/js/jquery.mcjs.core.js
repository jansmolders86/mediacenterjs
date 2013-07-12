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

	var ns = 'mcjs'
	,methods = {}

	function _init(options) {

		var opts = $.extend(true, {}, $.fn.mcjs.defaults, options);
		return this.each(function() {
			var $that = $(this)
				,o = $.extend(true, {}, opts, $that.data(opts.datasetKey));
				
			// add data to the defaults (e.g. $node caches etc)	
			o = $.extend(true, o, { 
				$that: $that
				,viewportWidth	: $(window).width()
				,viewportHeight	: $(window).height()
				,confirmMessage : undefined
				,succesMessage : undefined
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
			_initpages(o, $(this))
			_resizeviewport(o, $(this)); 	// Strech bg to fullscreen
			_keyevents(o,$(this)); 			// init keys
			_screensaver(o, $(this));

			$('a.cachelink').click(function(e){
				e.preventDefault();
				var cacheLink = $(this).attr('data-cachelink')
				, data = {cache : cacheLink}
				, url = '/clearCache';
				_GenericModal(o,url,data)
			});
		
			$('.remove').click(function(e){
				e.preventDefault();
				var moduleLink = $(this).find('a').attr('href')
				, data = {module : moduleLink}
				, url = '/removeModule';
				_GenericModal(o,url,data)
			});
		});
	}
	
	/**** Start of custom functions ***/
	
	function _initpages(o, $that){
		// Setup frontend validation
		$.ajax({
			url: '/configuration/', 
			type: 'get'
		}).done(function(data){
			$.i18n.properties({
				name: 'frontend-translation', 
				path:'/translations/', 
				mode:'map',
				language: data.language,
				extension: 'js',
				loadBaseFile: false ,
				callback: function() {
					o.confirmMessage = $.i18n.prop('confirmMessage')
					o.succesMessage = $.i18n.prop('succesMessage')
				}
			})
		});
	
		// Hide all ui boxes
		$(".ui-widget").hide();
		
		// Add fade effect
		$(".backdropimg").addClass("fadein");
		
		// Init Keyboard
		if(jQuery().keyboard) {
			if ( o.usekeyboard == 'yes' ){
				$('.keyboard').keyboard();
			}
		}	
	}
	
	function _GenericModal(o, url, data){
		var dialog = null
		dialog = $('<div>' + o.confirmMessage + '</div>').dialog({
			resizable: false,
			modal: true,
			buttons: [{
				text: "Ok",
				click: function () {
					dialog.dialog('destroy').remove();
					$.ajax({
						url: url, 
						type: 'post',
						data: data
					}).done(function(data){
						if(data == 'done'){
							$(".ui-widget").find('.message').html(o.succesMessage);
							$(".ui-widget").show();
						} 
					});
				},

			}, {
				text: "Cancel",
				click: function () {
					dialog.dialog('destroy').remove();
				},
			}]
		});
		dialog.dialog('open');
	}
	
	
	function _resizeviewport(o, $that){
		var $img = $(".fullscreen");
		$(window).resize(function() {
			var viewport = {
				width   : o.viewportWidth,
				height : o.viewportheight
			},
			ratio     = ($img.height() / $img.width()),
			imgHeight = Math.floor(viewport.width * ratio);
			$img.css({
				width     : o.viewportWidth,
				height    : imgHeight,
				marginTop : (imgHeight > o.viewportheight) ? Math.floor((imgHeight - o.viewportheight) / 2 * -1) : 0
			});
		});
	}
	
	
	/************ KEYBOARD HANDELING ***************/
	
	
	// Catch and set keyevents
	function _keyevents(o, $that){
		$(document).keydown(function(e){
			var focused = $('li.focused')
			,subitemFocused = $('.options:visible li.focused')
			,subitem = $('.options:visible li')
			,item = $('li')
			,elid = $(document.activeElement).is("input:focus")
			if (typeof e == 'undefined' && window.event) { e = window.event; }
			
			switch(e.keyCode) {
				case 39 : //next
					focused.removeClass('focused').next().addClass('focused');
					if (focused.next().length == 0) {
						item.eq(0).addClass('focused')
					}
				break;
				case 37 : //prev
					focused.removeClass('focused').prev().addClass('focused');
					if (item.prev().length == 0) {
						item.eq(-1).addClass('focused')
					}
				break;
				case 13 : //enter
					if (!elid){
						document.location = focused.find('a').attr('href');
					}
				break;
				case 8  : //backspace
					if (!elid){
						e.preventDefault()
						window.history.go(-1)
					}
				break;
				case 32 : 
					if (!elid){
						videojs("player").on("play", function(){
							videojs("player").pause();
						});
						videojs("player").on("pause", function(){
							videojs("player").play();
						});
					}
				break;
			}
		});
	}
	
	
	// Set idletimer for movieplayer to switch to fullscreen. Needs plugin - jquery.idletimer.js
	function _screensaver(o, $that){
		$.ajax({
			url: '/configuration/', 
			type: 'get'
		}).done(function(data){
			if (data.screensaver === 'dim'){
				var timeout = 600000; //10 min //TODO: make editable
				$(document).bind("idle.idleTimer", function(){
					$("html, body, #wrapper, #header").addClass("dim")
				});

				$(document).bind("active.idleTimer", function(){
				   $("html, body, #wrapper, #header").removeClass("dim")
				});

				$.idleTimer(timeout);
			} else if(data.screensaver === 'off'){
				return;
			}
		});
	}

	/**** End of custom functions ***/
	
	$.fn.mcjs = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || !method ) {
			return _init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.fn.mcjs' );
		};
	};
	
	/* default values for this plugin */
	$.fn.mcjs.defaults = {
		debug : true
	}

})(jQuery);