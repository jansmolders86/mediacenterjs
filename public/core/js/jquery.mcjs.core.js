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
	
	/************ Remote Control ****************/
	
	//Socket.io handler for remote control
	function _websocketHandler(o, $that){
		//TODO: Get port from config file
		if(io !== undefined){
			var socket = io.connect('http://localhost:3001');
			socket.on('connect', function(data){
				console.log(data);
				socket.emit('screen');
			});

			socket.on('controlling', function(data){
				var focused = $('.focused')
				,listItem = $('li')
				,anchorItem = $('#wrapper > a')
				,rowAchorITem = $('.row > a')
				,inputItem = $('input')
				,elid = $(document.activeElement).is("input:focus");

				if(data.action === "goLeft"){ 
					if(listItem.length > 0){
						var item = listItem;
						_goLeft(focused, item);
					}
					else if(anchorItem > 0){
						var item = anchorItem;
						_goLeft(focused, item);
					}
					else if(rowAchorITem > 0){
						var item = rowAchorITem;
						_goLeft(focused, item);
					}
					else if(inputItem > 0){
						var item = inputItem;
						_goLeft(focused, item);
					}
				}
				if(data.action === "back"){ 
					if ($('.backlink').length > 0) document.location = $('.backlink').attr('href');
				}
				if(data.action === "play"){ 
					videojs("player").play();
				}
				if(data.action === "pause"){ 
					videojs("player").pause();
				}
				if(data.action === "stop"){ 
					//TODO:
				}
				if(data.action === "fullscreen"){ 
					videojs("player").requestFullScreen()
				}
				else if(data.action === "goRight"){
					//TODO: on last item move to next element
					if(listItem.length > 0){
						var item = listItem;
						_goRight(focused, item);
					}
					else if(anchorItem > 0){
						var item = anchorItem;
						_goRight(focused, item);
					}
					else if(rowAchorITem > 0){
						var item = rowAchorITem;
						_goRight(focused, item);
					}
					else if(inputItem > 0){
						var item = inputItem;
						_goRight(focused, item);
					}
				}
				else if(data.action === "enter"){
					if (!elid && focused.length > 0) document.location = focused.find('a').attr('href');
				}
			});
		} else {
			console.log('Make sure you include the socket.io clientside javascript on the page!')
		}
		

		
	}
	
	
	/************ KEYBOARD HANDELING ***************/
	
	function _goRight(focused, item){
		if (focused.next(item).length == 0)item.eq(0).addClass('focused');
		focused.removeClass('focused').next(item).addClass('focused');
	}	
	
	function _goLeft(focused, item){
		if (item.prev(item).length == 0) item.eq(-1).addClass('focused');
		focused.removeClass('focused').prev().addClass('focused');
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
					focused.removeClass('focused').next().addClass('focused');
					if (focused.next().length == 0) item.eq(0).addClass('focused');
				break;
				case 37 : //prev
					focused.removeClass('focused').prev().addClass('focused');
					if (item.prev().length == 0) item.eq(-1).addClass('focused');
				break;
				case 13 : //enter
					if (!elid) document.location = focused.find('a').attr('href');
				break;
				case 8  : //backspace
					if (!elid){
						e.preventDefault()
						window.history.go(-1)
					}
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
		debug : true
	}

})(jQuery);