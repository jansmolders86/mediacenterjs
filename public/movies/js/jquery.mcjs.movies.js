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

	var ns = 'mcjsm'
	,methods = {}

	function _init(options) {
		var opts = $.extend(true, {}, $.fn.mcjsm.defaults, options);
		return this.each(function() {
			var $that = $(this)
				,o = $.extend(true, {}, opts, $that.data(opts.datasetKey));
				
			// add data to the defaults (e.g. $node caches etc)	
			o = $.extend(true, o, { 
				$that: $that
				,movielocation 	: undefined
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
			_loadCache(o, $(this));
			_focusedItem(o, $(this));
			_carousel(o, $(this));
			
		});
	}
	
	/**** Start of custom functions ***/

	function _loadCache(o, $that){
		$.ajax('/movies/config/moviefiles.js', {
			type: 'get',
			contentType: 'text/json',
			success: function(data) {
				data = $.parseJSON(data) 
				$.each(data, function(i,item) {
					if (typeof item.movieScraperInfo) {			
						if( $('#configuration').html() === 'yes'){ 
							var poster = item.movieScraperInfo.posters[2].image.url
							,backdrop = item.movieScraperInfo.backdrops[3].image.url
						} else if ($('#configuration').html() === 'no'){
							var poster = item.movieScraperInfo.posters[1].image.url
							,backdrop = item.movieScraperInfo.backdrops[2].image.url
						}
						var name = item.movieTitle
						,localposter = '/movies/cache/'+poster.match(/[^//]+$/i)
						,localbackdrop = '/movies/cache/'+backdrop.match(/[^//]+$/i);
						$.each($('.movieposter'), function() {
							if ( $(this).find('span').html() == name ){
								$(this).find("img.movieposter").attr('src',localposter);	
								$(this).find("img.movieposter").attr('data-backdrop',localbackdrop);	
								$(this).find("img.movieposter").addClass('coverfound');
							}	
						});
						if( $('#moviedetails').length){
							if (item.movieTitle == $('#moviedetails').find('h1').html()){
								$('#backdrop').find("img").attr('src',localbackdrop);
								$('#moviedetails').find('#overview').append('<p>'+item.movieScraperInfo.overview+'</p>');
								$('#moviedetails').find('#poster > img').attr('src',localposter).addClass('fadein');
								$('#moviedetails').find('#poster > .imdbrating').append('<p> IMDB <h3>'+item.movieScraperInfo.rating+'</h3></p>');
								$('#moviedetails').find('#poster > .certification').html(item.movieScraperInfo.certification);
								$('#moviedetailswrapper').addClass('fadeinslow');
							}
						}	
					}
				});
			
			},
			error  : function(configjson) {
				$('.guimessage').remove();
				$('#wrapper').append('<p class="guimessage">Can not get configfile. Please make sure it is present!</p>')
			}
		});
	};	

	/**** MOVIE HANDELING *******/
	
	function _focusedItem(o, $that){
		// movie poster handlers 
		$('.movieposter').on({
			mouseenter: function() {	
				$('.movieposters').find("li:first").removeClass("focused");
				var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
				$(this).addClass("focused")
				$(".backdropimg").attr("src", newBackground).addClass('fadeinslow');
			},
			mouseleave: function() {
				$(".backdropimg").removeClass("fadeinslow");
				if ($('.movieposter.focused').length > 1){
					$('.movieposter').removeClass("focused")
				}
			},			
			focus: function() {				
				var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
				$(".backdropimg").attr("src", newBackground).addClass('fadeinslow');
			},
			focusout: function() {
				$(".backdropimg").removeClass("fadeinslow");
			}
		});	
		
		if ($('.movieposter.focused')){
			var newBackground = $(this).find("img.movieposter").attr("data-backdrop");
			$(".backdropimg").attr("src", newBackground).addClass('fadeinslow');
		} 					
	};
	

	// Movie poster carousel - Needs plugin jquery.carouFredSel-6.1.0-packed.js
	function _carousel(o, $that){
		console.log('carousel')
		$('.movieposters').find(".movieposter:first").addClass("focused");
		$('.movieposters').carouFredSel({
			auto: false,
			prev: {
				key : "left",
				button : "#prev",
			},
			next: {
				key : "right",
				button : "#next",
			},
			scroll      : {
				fx : "scroll",
				easing  : "swing",
			},
			mousewheel: true,
			swipe: {
				onMouse: true,
				onTouch: true,
				fx : "scroll",
				easing  : "swing",
			}
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
		};
	};
	
	/* default values for this plugin */
	$.fn.mcjsm.defaults = {}

})(jQuery);