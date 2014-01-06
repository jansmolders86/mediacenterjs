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
				_modalDialog(o, url, type,data);
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
				, viewportWidth		    : $(window).width()
				, viewportHeight	    : $(window).height()
				, confirmMessage 	    : undefined
				, succesMessage 	    : undefined
                , RemoteIdle            : true
                , screenSaverTimeout    : 900000
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
			window.scrollTo(0,0);
			
			_initpages(o, $(this));			// Init core functionality
			_websocketHandler(o, $(this));	// Init remote control
			_resizeviewport(o, $(this)); 	// Strech bg to fullscreen
			_keyevents(o,$(this)); 			// Init keys
			_screensaver(o, $(this));		// Init screensaver

			$('a.cachelink').click(function(e){
				e.preventDefault();
				var cacheLink = $(this).attr('data-cachelink')
				, data = {cache : cacheLink}
				, url = '/clearCache'
				, type = 'post';
				_modalDialog(o, url, type,data);
			});
		
			$('.remove').click(function(e){
				e.preventDefault();
				var moduleLink = $(this).find('a').attr('href')
				, data = {module : moduleLink}
				, url = '/removeModule'
				, type = 'post';				
				_modalDialog(o, url, type,data);
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
					o.confirmMessage = $.i18n.prop('confirmMessage');
					o.succesMessage = $.i18n.prop('succesMessage');
				}
			})
		});
	
		// Hide all UI boxes
		$(".ui-widget").hide();
		
		// Add fade effect
		$(".backdropimg").addClass("fadein");
	}
	
	function _modalDialog(o, url, type, data){
		if (typeof jQuery.ui !== 'undefined'){
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
		} else {
			if(o.debug === true){
				console.log('If you want to include modal dialogs or error handling, please include the jQuery UI plugin');
			}
		}
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
		if(io){
			$.ajax({
					url: '/configuration/', 
					type: 'get'
				}).done(function(data){
					var socket = io.connect(data.localIP+':'+data.remotePort);
					socket.on('connect', function(data){
						socket.emit('screen');
					});

					socket.on('controlling', function(data){
						switch(data.action) {
							case "goLeft" :
								if($(o.accesibleItem).length > 0){
									var item = $(o.accesibleItem);
									_goLeft(o, item);
								}
							break;
							case "goRight" :
								if($(o.accesibleItem).length > 0){
									var item = $(o.accesibleItem);
									_goRight(o, item);
								}
							break;
							case "back" :
								_goBack(o);
							break;
							case "pause" :
								if(videojs("player").paused()){
									videojs("player").play();
								} else {
									videojs("player").pause();
								}
							break;
							case "fullscreen" :
								videojs("player").requestFullScreen();
							break;
							case "mute" :
								if(videojs("player").volume() === 0){
									videojs("player").volume(1)
								} else {
									videojs("player").volume(0);
								}
							break;							
							case "enter" :
								_pressEnter(o);
							break;
							case "dashboard" :
								if(window.location.pathname === '/plugins/'){
									$.ajax({
										url: '/plugins/reloadServer', 
										type: 'get',
										dataType: 'json'
									}).done(function(data){
										setTimeout(function(){
											document.location = '/';
										},1000);
									});
								} else {
									document.location = '/';
								}
							break;
						}	
					});

					socket.on('sending', function(data){
						$(o.focused).find("input").val(data);
					});
				});
		} else {
			if(o.debug === true){
				console.log('Make sure you include the socket.io clientside javascript plugin is on the page to allow the remote to access the page');
			}
		}
	}
	
	// Catch and set keyevents
	function _keyevents(o, $that){
		$(document).keydown(function(e){
			var elid = $(document.activeElement).is("input:focus");
			if (typeof e == 'undefined' && window.event) { e = window.event; }

			switch(e.keyCode) {
				case 39 : //next
					if($(o.accesibleItem).length > 0){
						var item = $(o.accesibleItem);
						_goRight(o, item);
					}
				break;
				case 37 : //prev
					if($(o.accesibleItem).length > 0){
						var item = $(o.accesibleItem);
						_goLeft(o, item);
					}
				break;
				case 13 : //enter
					_pressEnter(o);
				break;
				case 8  : //backspace
					if (!elid){
						e.preventDefault();
						_goBack(o);
					}
				break;
				case 32 :  //space
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
        o.RemoteIdle = false;
		if ($(o.focused).next(item).length == 0){
            item.eq(0).addClass('focused');
        }
		$(o.focused).removeClass('focused').next(item).addClass('focused').scrollintoview({direction: "vertical"});
	}	
	
	function _goLeft(o, item){
        o.RemoteIdle = false;
		if (item.prev(item).length == 0){ 
            item.eq(-1).addClass('focused');
        }
		$(o.focused).removeClass('focused').prev().addClass('focused').scrollintoview({direction: "vertical"});
	}	
	
	function _pressEnter(o, item){
        o.RemoteIdle = false;
		if ($(o.focused).length > 0){
			if ($(o.focused).find('.'+o.clickableItemClass).length > 0) {
				if($(o.focused).find('.'+o.clickableItemClass).is('input').length > 0){
					if($(o.focused).find('.'+o.clickableItemClass).is('input[type=submit]')){
						$(o.focused).find('.'+o.clickableItemClass).click();
					}
					$(o.focused).find('.'+o.clickableItemClass).focus();
				} else if($(o.focused).find('.'+o.clickableItemClass).is('a')) {
					if (typeof $(o.focused).find('.'+o.clickableItemClass).attr('href') !== 'undefined' && $(o.focused).find('.'+o.clickableItemClass).attr('href') !== false){
						document.location = $(o.focused).find('.'+o.clickableItemClass).attr('href');
					}
				} else if($(o.focused).find('a').length > 0) {
					if (typeof $(o.focused).find('a').attr('href') !== 'undefined' && $(o.focused).find('a').attr('href') !== false){
						document.location = $(o.focused).find('a').attr('href');
					}
				} else {
					$(o.focused).find('.'+o.clickableItemClass).click();
				}
			} else if($(o.focused).hasClass(o.clickableItemClass)){
				if($(o.focused).is('input')){
					if($(o.focused).is('input[type=submit]')){
						$(o.focused).click();
					}
					$(o.focused).focus();
				} else if($(o.focused).is('a')){
					if (typeof $('a'+o.focused).attr('href') !== 'undefined' && $('a'+o.focused).find('a').attr('href') !== false){
						document.location = $('a'+o.focused).attr('href');
					}
				} else {
					$(o.focused).click();
				}
			} else {
				return;
			}
		}
	}	

	function _goBack(o){
        o.RemoteIdle = false;
        if( !$(document.activeElement).is("input:focus")){
            if ($('.backlink').length > 0){
                if($('body').hasClass('playingMovie')){
                    document.location='/movies/';
                } else {
                    var attrHref = $('.backlink').attr('href');
                    if (typeof attrHref !== undefined && attrHref !== false){
                        var attrHref = $('.backlink').attr('href');
                        document.location = attrHref;
                    } else {
                        $('.backlink').click();
                    }
                }
			} else if( !$(document.activeElement).is("input:focus") ){
                window.history.go(-1);
			}
		}
	}
	
	
	/************ Screensaver ***************/
	
	function _screensaver(o, $that){
		$.ajax({
			url: '/configuration/', 
			type: 'get'
		}).done(function(data){
			if (data.screensaver === 'dim'){

                setInterval(function(){
                    console.log('Interval');
                    if(o.RemoteIdle === false ){
                        if(typeof videojs == 'function'){
                            if(videojs("player").paused()){
                                $("html, body, #wrapper, #header").addClass("dim");
                                o.RemoteIdle = true;
                                
                                clearInterval(o.screenSaverTimeout);
                            }
                        } else {
                            $("html, body, #wrapper, #header").addClass("dim");
                            o.RemoteIdle = true;
                            clearInterval(o.screenSaverTimeout);
                        }
                    } else {
                        clearInterval(o.screenSaverTimeout);
                    }
                },o.screenSaverTimeout);

				$(document).bind("idle.idleTimer", function(){
                    if(typeof videojs == 'function'){
                        if(videojs("player").paused()){
                            $("html, body, #wrapper, #header").addClass("dim");
                        } else{
                            return;
                        }
                    }else {
                        $("html, body, #wrapper, #header").addClass("dim");
                    }                    
				});

				$(document).bind("active.idleTimer", function(){
					$("html, body, #wrapper, #header").removeClass("dim")
				});
				
				$.idleTimer(o.screenSaverTimeout);

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
		debug : false,
		focused : '.focused',
		accesibleItem :'.mcjs-rc-controllable',
		clickableItemClass : 'mcjs-rc-clickable'
	}
})(jQuery);
