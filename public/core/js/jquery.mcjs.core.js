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
    ,methods = {
		/**
			This public function allows you to use a modal dialog 
			with a ajax call with a generic conformation message
			@param url 			AJAX url	(ie '/setup')
			@param data			AJAX data	(ie {module : moduleLink})
			@param type 		AJAX type  	(ie  'post' or 'get')
		*/
		modalDialog : function modalDialog(url, type,data) {
			return this.each(function() {
				var o = $.data(this, ns);
				_modalDialog(o, url, type,data)
			});
		}
		
    }

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
			
			window.scrollTo(0,0);
			
			_initpages(o, $(this));
			_websocketHandler(o, $(this));
			_resizeviewport(o, $(this)); 	// Strech bg to fullscreen
			_keyevents(o,$(this)); 			// init keys
			_screensaver(o, $(this));

			$('a.cachelink').click(function(e){
				e.preventDefault();
				var cacheLink = $(this).attr('data-cachelink')
				, data = {cache : cacheLink}
				, url = '/clearCache'
				, type = 'post';
				_modalDialog(o, url, type,data)
			});
		
			$('.remove').click(function(e){
				e.preventDefault();
				var moduleLink = $(this).find('a').attr('href')
				, data = {module : moduleLink}
				, url = '/removeModule'
				, type = 'post';				
				_modalDialog(o, url, type,data)
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
				name: 'translation', 
				path:'/translations/frontend/', 
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
			if ( o.usekeyboard == 'yes' ) $('.keyboard').keyboard();
		}	
	}
	
	function _modalDialog(o, url, type, data){
		var dialog = null;
		dialog = $('<div>' + o.confirmMessage + '</div>').dialog({
			resizable: false,
			modal: true,
			buttons: [{
				text: "Ok",
				click: function () {
					dialog.dialog('destroy').remove();
					$.ajax({
						url: url, 
						type: type,
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
	
	
	
	/************ KEYBOARD/REMOTE HANDELING ***************/
	
	
	//Socket.io handler for remote control
	function _websocketHandler(o, $that){
		if(io !== undefined){
			$.ajax({
					url: '/configuration/', 
					type: 'get'
				}).done(function(data){
					var socket = io.connect(data.localIP+':'+data.remotePort);
					socket.on('connect', function(data){
						socket.emit('screen');
					});

					socket.on('controlling', function(data){
						if(data.action === "goLeft"){ 
							if($(o.accesibleItem).length > 0){
								var item = $(o.accesibleItem);
								_goLeft(o, item);
							}
						}
						if(data.action === "back"){ 
							_goBack(o);
						}
						if(data.action === "pause"){ 
							if (!elid){
								if(videojs("player").paused()){
									videojs("player").play();
								} else {
									videojs("player").pause();
								}
							}
						}
						if(data.action === "fullscreen"){ 
							videojs("player").requestFullScreen();
						}
						else if(data.action === "goRight"){
							if($(o.accesibleItem).length > 0){
								var item = $(o.accesibleItem);
								_goRight(o, item);
							}
						}
						else if(data.action === "enter"){
							_pressEnter(o);
						}
					});
				});
		} else {
			console.log('Make sure you include the socket.io clientside javascript on the page!')
		}
	}
	
	// Catch and set keyevents
	function _keyevents(o, $that){
		$(document).keydown(function(e){
			var focused = $('li.focused')
			,subitemFocused = $('.options:visible li.focused')
			,subitem = $('.options:visible li')
			,item = $('li')
			,elid = $(document.activeElement).is("input:focus");
			
			if (typeof e == 'undefined' && window.event) { e = window.event; }
			
			switch(e.keyCode) {
				case 39 : //next
					_goRight(o, item);
				break;
				case 37 : //prev
					_goLeft(o, item);
				break;
				case 13 : //enter
					_pressEnter(o);
				break;
				case 8  : //backspace
					_goBack(o);
				break;
				case 32 : 
					if (!elid){
						if(videojs("player").paused()){
							videojs("player").play();
						} else {
							videojs("player").pause();
						}
					}
				break;
			}
		});
	}
	
	function _goRight(o, item){
		if ($(o.focused).next(item).length == 0)item.eq(0).addClass('focused');
		$(o.focused).removeClass('focused').next(item).addClass('focused');
	}	
	
	function _goLeft(o, item){
		if (item.prev(item).length == 0) item.eq(-1).addClass('focused');
		$(o.focused).removeClass('focused').prev().addClass('focused');
	}	
	
	function _pressEnter(o, item){
		if ($(o.focused).length > 0){
			var attrHref = $(o.focused).find('a').attr('href');
			if (typeof attrHref !== 'undefined' && attrHref !== false){
				document.location = attrHref;
			} else if ($(o.focused).find('.'+o.clickableItemClass).length > 0) {
				$(o.focused).find('.'+o.clickableItemClass).click();
			} else if($(o.focused).hasClass(o.clickableItemClass)){
				$(o.focused).click();
			} else if($(o.focused).find('input').length > 0){
				$(o.focused).find('input').focus();
			}else {
				return;
			}
		}
	}	

	function _goBack(o){
		if ($('.backlink').length > 0){
			$('.backlink').click();
		} else if(!$(document.activeElement).is("input:focus")){
			e.preventDefault()
			window.history.go(-1)
		}
	}		
	
	// Returns true or false
	function _isElementVisibleInViewPort(el) {
		var eap,
			rect     = el.getBoundingClientRect(),
			vWidth   = window.innerWidth || doc.documentElement.clientWidth,
			vHeight  = window.innerHeight || doc.documentElement.clientHeight,
			efp      = function (x, y) { return document.elementFromPoint(x, y) },
			contains = "contains" in el ? "contains" : "compareDocumentPosition",
			has      = contains == "contains" ? 1 : 0x10;

		// Return false if it's not in the viewport
		if (rect.right < 0 || rect.bottom < 0 || rect.left > vWidth || rect.top > vHeight){
			return false;
		}
		
		// Return true if any of its four corners are visible
		return (
			  (eap = efp(rect.left,  rect.top)) == el || el[contains](eap) == has
		  ||  (eap = efp(rect.right, rect.top)) == el || el[contains](eap) == has
		  ||  (eap = efp(rect.right, rect.bottom)) == el || el[contains](eap) == has
		  ||  (eap = efp(rect.left,  rect.bottom)) == el || el[contains](eap) == has
		);
	}
	
	
	
	/************ Screensaver ***************/
	
	function _screensaver(o, $that){
		$.ajax({
			url: '/configuration/', 
			type: 'get'
		}).done(function(data){
			if (data.screensaver === 'dim'){
				var timeout = 600000; //10 min //TODO: make editable
				$(document).bind("idle.idleTimer", function(){
					if(videojs("player").paused()){
						$("html, body, #wrapper, #header").addClass("dim")
					} else{
						return;
					}
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
		datasetKey: 'mcjs', //always lowercase
		debug : true,
		focused : '.focused',
		accesibleItem :'.mcjs-rm-controllable',
		clickableItemClass : 'mcjs-rc-clickable'
	}

})(jQuery);