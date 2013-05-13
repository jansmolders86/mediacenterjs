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

	var ns = 'mcjsw'
	,methods = {}

	function _init(options) {

		var opts = $.extend(true, {}, $.fn.mcjsw.defaults, options);
		return this.each(function() {
			var $that = $(this)
				,o = $.extend(true, {}, opts, $that.data(opts.datasetKey));
				
			// add data to the defaults (e.g. $node caches etc)	
			o = $.extend(true, o, { 
				$that: $that,
				language : $('body').find('.language').html(),
				LANG : $('body').find('.language').html().toUpperCase(),
				location : $('body').find('.location').html()
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
	
			_currentweather(o, $(this))
			_forecastweather(o, $(this))
			
		});
	}
	
	/**** Start of custom functions ***/
	
	
	// Get Current weather
	//TODO: Make multilanguage
	function _currentweather(o, $that){
		if ( $('body').hasClass('weather') || $('body').find('h1') == '' ){
			$.ajax({
				url : "http://api.wunderground.com/api/68a6ea8f6013979c/geolookup/conditions/lang:"+o.LANG+"/q/"+ o.language +"/"+ o.location+".json",
				dataType : "jsonp",
				success : function(parsed_json) {
					if (parsed_json['response']['error']){
						var errorMessage = parsed_json['response']['error']['description']
						$("#weather").find("h1").html(errorMessage);
					}else {
						var locations = parsed_json['location']['city'];
						var country = parsed_json['location']['country'];
						var weathertype = parsed_json['current_observation']['weather'];
						var weathericon = parsed_json['current_observation']['icon_url'];
						var feelslike_c = parsed_json['current_observation']['feelslike_c'];
						var temp_c = parsed_json['current_observation']['temp_c'];
						
						$("#weather").find("h1").html( locations +", "+ country);
						$("#weather").find(".weathertype").html(weathertype);
						$("#weather").find(".degrees").html( temp_c + " <sup>&#8451;</sup>");
						$("#weather").find(".feelslike").html( "Gevoelstemperatuur: " + feelslike_c + " <sup>&#8451;</sup>");

						var weathertypeset = $('.weathertype').text()
				
						if ( weathertypeset.match(/bewolkt/gi) ){
							$(".backdropimg").attr('src', "/weather/img/clouds.jpg").addClass("fadein");
						}else if( weathertypeset.match(/mist/gi) ){
							$(".backdropimg").attr('src', "/weather/img/misty.jpg").addClass("fadein");
						}else if( weathertypeset.match(/helder/gi) ){
							$(".backdropimg").attr('src', "/weather/img/clear.jpg").addClass("fadein");
						}else if( weathertypeset.match(/zon/gi) ){
							$(".backdropimg").attr('src', "/weather/img/sunny.jpg").addClass("fadein");
						}else if( weathertypeset.match(/regen/gi) ){
							$(".backdropimg").attr('src', "/weather/img/rainy.jpg").addClass("fadein");
						}else if( weathertypeset.match(/sneeuw/gi) ){
							$(".backdropimg").attr('src', "/weather/img/snowy.jpg").addClass("fadein");
						}else if( weathertypeset.match(/storm/gi) ){
							$(".backdropimg").attr('src', "/weather/img/stormy.jpg").addClass("fadein");
						}else {
							$(".backdropimg").attr('src', "/weather/img/default.jpg").addClass("fadein");
						}
						$('#weatherwrapper').addClass('fadeinslow');
					}
				},
				error : function() {
					$("#weather").find("h1").html( 'Can not get weather of location' + o.location + '<br/> Please specify a larger city.');
				}
			})
		} else {
			return
		};	
	}

	
	// Get Forecast
	function _forecastweather(o, $that){
		if ( $('body').hasClass('weather') || $('body').find('h1') == '' ){
			$(".forecast").find("ul").remove()
			$.ajax({
				url : "http://api.wunderground.com/api/68a6ea8f6013979c/forecast/lang:"+o.LANG+"/q/"+o.language+"/"+o.location+".json",
				dataType : "jsonp",
				success : function(forecast_data) {
					var forecastday = forecast_data['forecast']['simpleforecast']['forecastday'];
					$.each(forecastday, function (index, value) {	
						var day = value;
						// for each day in the week (which is 4 )
						var daycount = 1;
						for(var i = 0; i < daycount; i++) {
							var weekday = day.date.weekday							
							var conditions = day.conditions
							var mintemp = day.low.celsius	
							var maxtemp = day.high.celsius
							$("#weather").find(".forecast").append('<ul> <li class="weekday">'+ weekday +'</li> <li class="conditions">'+ conditions +'</li>  <li class="mintemp"> Min: '+ mintemp +'</li>  <li class="maxtemp"> Max:'+ maxtemp +'</li> </ul>');	
						}
					})
				}
			})
		} else {
			return
		};		
	}
	

	/**** End of custom functions ***/
	
	$.fn.mcjsw = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || !method ) {
			return _init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.fn.mcjsw' );
		};
	};
	
	/* default values for this plugin */
	$.fn.mcjsw.defaults = {}

})(jQuery);