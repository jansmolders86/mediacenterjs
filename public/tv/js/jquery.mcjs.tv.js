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

	var ns = 'mcjstv';
	var methods = {};

	function _init(options) {
		var opts = $.extend(true, {}, $.fn.mcjstv.defaults, options);
		return this.each(function() {
			var $that = $(this);
			var o = $.extend(true, {}, opts, $that.data(opts.datasetKey));
				
			// add data to the defaults (e.g. $node caches etc)	
			o = $.extend(true, o, { 
				$that: $that
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
			$('body').scroll( function(){
				_lazyload(o);
			});
			_lazyload(o);

			$('.overlay').click(function(e) {
				e.preventDefault();	
				var url = '/tv/video/' + $(this).attr('data-tvshow')
				//TODO: Go to season
				//_playTVShow(url)
			});
			
		});
	}
	
	/**** Start of custom functions ***/
	
	function _lazyload(o){
		//Set timeout for fast scrolling
		setTimeout(function(){
			var WindowTop = $('body').scrollTop()
			, WindowBottom = WindowTop + $('body').height();

			$(".tvshow").each(function(){
				var offsetTop = $(this).offset().top
				, offsetBottom = offsetTop + $(this).height();

				if(!$(this).attr("loaded") && WindowTop <= offsetBottom && WindowBottom >= offsetTop){
					var title = $(this).find('span.title').html()
					, visibleTv = $(this);
					_handlevisibleTVShows(o, title, visibleTv)
					$(this).attr("loaded",true);
				}
			});	
		},500);
	}
	
	function _handlevisibleTVShows(o, title, visibleTv){
		if(title !== undefined){
			$.ajax({
				url: '/tv/post/', 
				type: 'post',
				data: {tvTitle : title}
			}).done(function(data){
				var tvData = $.parseJSON(data);
				console.log(tvData[0])
				setTimeout(function(){
					visibleTv.find('img').attr('src',tvData[0].banner);		
					visibleTv.addClass('coverfound');		
				},400);
			});
		}		
	}
	

	/**** End of custom functions ***/
	
	$.fn.mcjstv = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || !method ) {
			return _init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.fn.mcjstv' );
		}
	};
	
	/* default values for this plugin */
	$.fn.mcjstv.defaults = {};

})(jQuery);