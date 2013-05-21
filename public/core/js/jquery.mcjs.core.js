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
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
	
			_resizeviewport(o, $(this)); 	// Strech bg to fullscreen
			_keyevents(o,$(this)); 			// init keys
			
			if(o.debug == false){
				$(document).bind("contextmenu", function(e) {
					return false;
				});
			}
			
			_initpages(o, $(this))
		});
	}
	
	/**** Start of custom functions ***/
	
	function _initpages(o, $that){
		$(".backdropimg").addClass("fadein");
	
		// If stated in config and if the plugin is present, add a onscreen keyboard
		if(jQuery().keyboard) {
			if ( o.usekeyboard == 'yes' ){
				$('.keyboard').keyboard();
			}
		}	
	}
	
	// Resize background image according to viewport if the image has class fullscreen
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
			
			switch(e.keyCode) {
				case 40 : //down
					focused.removeClass('focused').next().addClass('focused');
					if (focused.next().length == 0) {
						item.eq(0).addClass('focused')
					}
				break;
				case 38 : //up
					focused.removeClass('focused').prev().addClass('focused');
					if (item.prev().length == 0) {
						item.eq(-1).addClass('focused')
					}
				break;
				case 37 : //left
					subitemFocused.removeClass('focused').prev().addClass('focused');
					if (subitemFocused.prev().length == 0) {
						subitem.eq(-1).addClass('focused')
					}
				break;
				case 39 : //right
					subitemFocused.removeClass('focused').next().addClass('focused');
					if (subitemFocused.next().length == 0) {
						subitem.eq(0).addClass('focused')
					}
				break;
				case 13 : //enter
					document.location = focused.find('a').attr('href');
				break;
				case 8  : //backspace
					if (!elid){
						e.preventDefault()
						window.history.go(-1)
					}
				break;
				case 32 : 
					//spacebar
				break;
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