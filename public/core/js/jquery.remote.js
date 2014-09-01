/*
	MediaCenterJS - A NodeJS based mediacenter solution
	
    Copyright (C) 2014 - Jan Smolders

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
'use strict';

(function($){

	var ns = 'mcjsRemote'
    ,methods = {}

	function _init(options) {

		var opts = $.extend(true, {}, $.fn.mcjsRemote.defaults, options);
		return this.each(function() {
			var $that = $(this)
				,o = $.extend(true, {}, opts, $that.data(opts.datasetKey));
				
			// add data to the defaults (e.g. $node caches etc)	
			o = $.extend(true, o, { 
				$that: $that
                , RemoteIdle            : true
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
			_websocketHandler(o, $(this));	// Init remote control
			_keyevents(o,$(this)); 			// Init keys

		});
	}
	

	/************ KEYBOARD/REMOTE HANDELING ***************/
	
	
	//Socket.io handler for remote control
	function _websocketHandler(o, $that){
		if (io) {
            var socket = io.connect();
			socket.on('connect', function(data){
				socket.emit('screen');
			});

			socket.on('controlling', function(data){
                switch(data.action) {
                    case "goLeft" :
                        if($(o.accessibleElement).length > 0){
                            var item = $(o.accessibleElement);
                            _goLeft(o, item);
                        }
                    break;
                    case "goRight" :
                        if($(o.accessibleElement).length > 0){
                            var item = $(o.accessibleElement);
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
               
			}).removeListener('controlling', function(){});

			socket.on('sending', function(data){
				$(o.focusedElement).find("input").val(data);
			});
		} else {
			if (o.debug === true) {
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
					if($(o.accessibleElement).length > 0){
                        if($(o.activeSubLevelElement).length > 0){
                            var item = $('.music > li:visible').find("#tracks:visible > li.mcjs-rc-controllable:first")
                        } else{
						    var item = $(o.accessibleElement);
                        }
						_goRight(o, item);
					}
				break;
				case 37 : //prev
					if($(o.accessibleElement).length > 0){
                        if( $(o.activeSubLevelElement).length > 0){
                            var item = $('.music > li:visible').find("#tracks:visible > li.mcjs-rc-controllable:first")
                        } else{
                            var item = $(o.accessibleElement);
                        }
						_goLeft(o, item);
					}
				break;
				case 13 : //enter
                    e.preventDefault();
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
        if($("html, body, #wrapper, #header").hasClass("dim")){
            $("html, body, #wrapper, #header").removeClass("dim");
        }
		if ($(o.focusedElement).next(item).length == 0){
            item.eq(0).addClass(o.focusedClass).scrollintoview({direction: "vertical"});
        }
		$(o.focusedElement).removeClass(o.focusedClass).next().addClass(o.focusedClass).scrollintoview({direction: "vertical"});
	}	
	
	function _goLeft(o, item){
        o.RemoteIdle = false;
        if($("html, body, #wrapper, #header").hasClass("dim")){
            $("html, body, #wrapper, #header").removeClass("dim");
        }
		if (item.prev(item).length == 0){
            item.eq(-1).addClass(o.focusedClass).scrollintoview({direction: "vertical"});
        }
		$(o.focusedElement).removeClass(o.focusedClass).prev().addClass(o.focusedClass).scrollintoview({direction: "vertical"});
	}	
	
	function _pressEnter(o){
        o.RemoteIdle = false;
        if($("html, body, #wrapper, #header").hasClass("dim")){
            $("html, body, #wrapper, #header").removeClass("dim");
        }
		if ($(o.focusedElement).length > 0){
			if ($(o.focusedElement).find('.'+o.clickableItemClass).length > 0) {
				if($(o.focusedElement+' > .'+o.clickableItemClass).is('input')){
					if($(o.focusedElement+' > .'+o.clickableItemClass).is('input[type=submit]')){
						$(o.focusedElement+' > .'+o.clickableItemClass).click();
					}
					$(o.focusedElement+' >.'+o.clickableItemClass).focus();
				} else if($(o.focusedElement+' > .'+o.clickableItemClass).is('a')) {
					if (typeof $(o.focusedElement+' > .'+o.clickableItemClass).is('[href]') && $(o.focusedElement+' > .'+o.clickableItemClass).attr('href') !== undefined && $(o.focusedElement+' > .'+o.clickableItemClass).attr('href') !== "" ){
						document.location = $(o.focusedElement).find('.'+o.clickableItemClass).attr('href');
					} else {
                        $(o.focusedElement+' > a.'+o.clickableItemClass).click();
                        $(o.focusedElement).removeClass(o.focusedElementClass);
                    }
                } else if($(o.focusedElement+' > a').length > 0) {
					if (typeof $(o.focusedElement+' > a').attr('href') !== 'undefined' && $(o.focusedElement).find('a').attr('href') !== false){
						document.location = $(o.focusedElement+' > a').attr('href');
					}
				} else {
					$(o.focusedElement+' > .'+o.clickableItemClass).click();
				}
			} else if($(o.focusedElement).hasClass(o.clickableItemClass)){
				if($(o.focusedElement).is('input')){
					if($(o.focusedElement).is('input[type=submit]')){
						$(o.focusedElement).click();
					}
					$(o.focusedElement).focus();
				} else if($(o.focusedElement).is('a')){
					if (typeof $('a'+o.focusedElement).attr('href') !== 'undefined' && $('a'+o.focusedElement).find('a').attr('href') !== false){
						document.location = $('a'+o.focusedElement).attr('href');
					}
				} else {
					$(o.focusedElement).click();
				}
			} else {
				return;
			}
		} else if($('button').focus()){
            $('button').click();
        }else if($('input[type=submit]').focus()){
            $('input[type=submit]').click();
        }else if($('a').focus()){
            if (typeof $('a').is('[href]') && $('a').attr('href') !== undefined && $('a').attr('href') !== "" ){
                document.location = $('a').attr('href');
            } else {
                $('a').click();
                $(o.focusedElement).removeClass(o.focusedElementClass);
            }
        }else if($('li.'+o.clickableItemClass).hasClass(o.focusedClass)) {
            $('li.'+o.clickableItemClass).click();
        }
	}

	function _goBack(o){
        o.RemoteIdle = false;

        if( !$(document.activeElement).is("input:focus")){
            if($('body').hasClass('playingMovie')){
                document.location='/movies/';
            } else if( $(o.activeSubLevelElement).length > 0){
                $(o.activeSubLevelElement).removeClass(o.activeSubLevelClass);
                if($(o.accessibleElement).is(":hidden")){
                    $(o.accessibleElement).show();
                }
                $(o.focusedElement).removeClass(o.focusedElementClass);
            }else if( $(o.backElement).length > 0 && $(o.activeSubLevelElement).length < 1){
                var attrHref = $(o.backElement).attr('href');
                if (typeof attrHref !== undefined && attrHref !== false && $(o.backElement).is('[href]')){
                    var attrHref = $(o.backElement).attr('href');
                    document.location = attrHref;
                } else if($(o.backElement).hasClass(o.clickableItemClass)){
                    $(o.backElement).click();
                } else {
                    window.history.go(-1);
                }
            } else {
                window.history.go(-1);
            }
		}
	}

	/**** End of custom functions ***/
	
	$.fn.mcjsRemote = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || !method ) {
			return _init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.fn.mcjsRemote' );
		};
	};
	
	/* default values for this plugin */
	$.fn.mcjsRemote.defaults = {
		datasetKey: 'mcjsRemote', //always lowercase
		debug : false,
		focusedElement : '.focused',
		focusedClass : 'focused',
		accessibleElement :'.mcjs-rc-controllable',
		activeSubLevelElement :'.mcjs-rc-active',
		activeSubLevelClass :'mcjs-rc-active',
		clickableItemClass : 'mcjs-rc-clickable',
        backElement : '.backlink'
	}
})(jQuery);
