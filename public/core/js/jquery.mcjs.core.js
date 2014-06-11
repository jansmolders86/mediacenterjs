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
			_resizeviewport(o, $(this)); 	// Strech bg to fullscreen
			_screensaver(o, $(this));		// Init screensaver

            
            //TODO: place these in settings js
			$('a.cachelink').click(function(e){
				e.preventDefault();
				var cacheLink = $(this).attr('data-cachelink')
				, data = {cache : cacheLink}
				, url = '/clearCache'
				, type = 'post';
				_modalDialog(o, url, type,data);
			});
            
            $('a.scraperlink').click(function(e){
                e.preventDefault();
                var scraperlink = $(this).attr('data-scraperlink')
                , data = {scraperlink : scraperlink}
                , url = '/getScraperData'
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
		
		// Setup frontend translations
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

	/************ Screensaver ***************/
	
	function _screensaver(o, $that){
		$.ajax({
			url: '/configuration/', 
			type: 'get'
		}).done(function(data){

            setInterval(function(){
                if(o.RemoteIdle === false ){
                    if(typeof videojs == 'function'){
                        if(videojs("player").paused()){

                            if (data.screensaver === 'dim') {
                                $("html, body, #wrapper, #header").addClass("dim");
                                o.RemoteIdle = true;
                            } else if(data.screensaver === 'off') {
                                return;
                            } else if (data.screensaver === 'backdrop') {
                                _backdropScreensaver(o);
                                o.RemoteIdle = true;
                            }
                            clearInterval(o.screenSaverTimeout);
                        }
                    } else {
                        if (data.screensaver === 'dim') {
                            $("html, body, #wrapper, #header").addClass("dim");
                            o.RemoteIdle = true;

                        }else if(data.screensaver === 'off') {
                            return;
                        } else if (data.screensaver === 'backdrop') {
                            _backdropScreensaver(o);
                            o.RemoteIdle = true;
                        }
                        clearInterval(o.screenSaverTimeout);
                    }
                } else {
                    clearInterval(o.screenSaverTimeout);
                }
            },o.screenSaverTimeout);

            $(document).bind("idle.idleTimer", function(){
                if(typeof videojs == 'function'){
                    if(videojs("player").paused()){

                        if (data.screensaver === 'dim') {
                            $("html, body, #wrapper, #header").addClass("dim");
                        }else if(data.screensaver === 'off') {
                            return;
                        } else if (data.screensaver === 'backdrop') {
                            $('body > div').css('display', 'none');
                            _backdropScreensaver(o);
                        }
                    } else{
                        return;
                    }
                }else {
                    if (data.screensaver === 'dim') {
                        $("html, body, #wrapper, #header").addClass("dim");
                    }else if(data.screensaver === 'off') {
                        return;
                    } else if (data.screensaver === 'backdrop') {
                        $('body > div').css('display', 'none');
                        $("body").addClass('screensaver');
                        _backdropScreensaver(o);
                    }
                }
            });

            $(document).bind("active.idleTimer", function(){
                if (data.screensaver === 'dim') {
                    $("html, body, #wrapper, #header").removeClass("dim");
                }else if(data.screensaver === 'off') {
                    return;
                } else if (data.screensaver === 'backdrop') {
                    $("#screensaver").remove();
                    $("body").removeClass('screensaver');
                    $("body > div").css("display","block");
                }
            });

            $.idleTimer(o.screenSaverTimeout);

		});
	}

    function _backdropScreensaver(o){
        $.ajax({
            url: '/movies/backdrops/',
            type: 'get'
        }).done(function(data) {
            var img_array = data;
            var index = 0;
            var interval = 5000;

            setTimeout(function () {
                $('body').append('<img width="100%" height="100%" id="screensaver" src="" class="fullscreen" />');
                $("#screensaver").attr("src",img_array[index++ % img_array.length]);
                setTimeout(arguments.callee, interval);
            }, interval);

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
		focusedElement : '.focused',
		focusedClass : 'focused',
		accessibleElement :'.mcjs-rc-controllable',
		activeSubLevelElement :'.mcjs-rc-active',
		activeSubLevelClass :'mcjs-rc-active',
		clickableItemClass : 'mcjs-rc-clickable',
        backElement : '.backlink'
	}
})(jQuery);
