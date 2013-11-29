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
				language : '',
				LANG : '',
				location : '',
				cloudy : new RegExp('cloudy',"gi"),
				partly_cloudy : new RegExp('partlycloudy',"gi"),
				mist : new RegExp('mist',"gi"),
				clear : new RegExp('clear',"gi"),
				sunny : new RegExp('sunny',"gi"),
				rain : new RegExp('rain',"gi"),
				snow : new RegExp('snow',"gi"),
				storm : new RegExp('storm',"gi"),
				countries_with_fahrenheit : new RegExp('US|UM|BZ|BM|JM|PW|PR|GU|VI|KY',"i"), 
				feelsLike : '',
				tempIndicator  : 'c',
				tempIndicatorSign  : '',
				error  : '', 
				queryParameters : '', 
				body: $('body')
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
	
			_currentweather(o, $(this))
			
		});
	}
	
	/**** Start of custom functions ***/
	
	// Get Current weather
	function _currentweather(o, $that) {
		$.ajax({
			url: '/configuration/', 
			type: 'get'
		}).done(function(data){
			o.location = data.location;
			o.language = data.language;
			
			//Set up i18n translation
			$.i18n.properties({
				name: 'translation', 
				path:'/translations/frontend/', 
				mode:'map',
				language: data.language,
				extension: 'js',
				loadBaseFile: false ,
				callback: function() {
					o.feelsLike = $.i18n.prop('feelsLike');
					o.error = $.i18n.prop('error_weather');
					o.LANG = $.i18n.prop('weather_underground_languagecode');
					o.queryParameters = "lang:"+o.LANG+"/q/"+o.language+"/"+ o.location+".json";
					
					$(".current h2").html($.i18n.prop('weather_current'));
					
					// Receive Weather Data from WeatherUnderground-API
					 _getCurrentCondition(o);
					_getForecast(o);
				}
			});	
		}); 
	}
  
  function _getCurrentCondition(o) {
		$.ajax({
			url : o.baseApiUrl + "geolookup/conditions/" + o.queryParameters,
			dataType : "jsonp",
			success : function(parsed_json) {
				if (parsed_json['response']['error']) {
					var errorMessage = parsed_json['response']['error']['description'];
					o.body.find("h1").html(errorMessage);
				} else {
					var location = parsed_json['location']['city'];
					var country = parsed_json['location']['country_iso3166'];
					var weathertype = parsed_json['current_observation']['weather'];
          
					o.tempIndicator = country.match(o.countries_with_fahrenheit) ? 'f' : 'c';
					o.tempIndicatorSign = o.tempIndicator === 'f' ? '&#8457;' : '&#8451;';
          
					var feelslike = parsed_json['current_observation']['feelslike_' + o.tempIndicator];
					var temp = parsed_json['current_observation']['temp_' + o.tempIndicator];
					
					o.body.find("h1").html(location + ", " + country);
					o.body.find(".weathertype > .text").html(weathertype);
					o.body.find(".degrees").html(temp + " <sup>" + o.tempIndicatorSign + "</sup>");
					o.body.find(".feelslike").html(o.feelsLike + " " + feelslike + " <sup>" + o.tempIndicatorSign + "</sup>");

					var weathertypeset = parsed_json['current_observation']['icon'];
					
					_setConditionIcon(o, o.body.find(".weathertype > .icon"), weathertypeset);
					_setWeatherBackdrop(o, $(o.backdropImageSelector), weathertypeset);
				}
			},
			error : function() {
				o.body.find("h1").html( 'Error: ' + o.location + '<br />' + o.error);
			}
		});
  }
  
  function _getForecast(o, country) {
		$(o.forecastSelector).find("li").remove();
		$.ajax({
			url : o.baseApiUrl + "forecast/" + o.queryParameters,
			dataType : "jsonp",
			success : function(forecast_data) {
				var forecastdays = forecast_data['forecast']['simpleforecast']['forecastday'];
				$.each(forecastdays, function (index, day) {	
					var weekday = day.date.weekday;
					var conditions = day.icon;
					
					var tempIndicatorWord = o.tempIndicator === 'f' ? 'fahrenheit' : 'celsius';
					var mintemp = day.low[tempIndicatorWord] + ' ' + o.tempIndicatorSign;
					var maxtemp = day.high[tempIndicatorWord] + ' ' + o.tempIndicatorSign;
          
					$(o.forecastSelector).append('<li> <div class="weekday">'+ weekday +'</div> <div class="conditions" style="" data-weatherType="'+conditions+'"></div>  <div class="mintemp"> Min: ' + mintemp + '</div>  <div class="maxtemp"> Max: ' + maxtemp + '</div> </li>');
					
					$(o.forecastSelector).find('li').each(function() {
						var conditionsElement = $(this).find('.conditions');
						var weatherType = conditionsElement.attr('data-weatherType');
						_setConditionIcon(o, conditionsElement, weatherType);
					});
				});
			}
		});
  }
	
  function _setConditionIcon(o, object, condition) {
    var position = 'left -135px top 0px';
    if (condition.match(o.partly_cloudy)){
		position = 'left -135px top 0px';
	} else if (condition.match(o.cloudy)){
		position = 'left -5px top -5px';
	} else if (condition.match(o.mist)) {
		position = 'left -520px top -135px';
	} else if (condition.match(o.clear)) {
		position = 'left -65px top -260px';
	} else if (condition.match(o.sunny)) {
		position = 'left -65px top -260px';
	} else if (condition.match(o.rain)) {
		position = 'left -260px top -4px';
	} else if (condition.match(o.snow)) {
		position = 'left -130px top -131px';
	} else if (condition.match(o.storm)) {
		position = 'left -520px top -201px';
	}
    
    $(object).css('background', 'url("/weather/img/climacons.png") no-repeat ' + position);
  }
	
  function _setWeatherBackdrop(o, object, condition) {
    var backdropFileName = "default.jpg";
    
	if (condition.match(o.cloudy)) {
		backdropFileName = "clouds.jpg";
	} else if(condition.match(o.mist)) {
		backdropFileName = "misty.jpg";
	} else if(condition.match(o.clear)) {
		backdropFileName = "clear.jpg";
	} else if(condition.match(o.sunny)) {
		backdropFileName = "sunny.jpg";
	} else if(condition.match(o.rain)) {
		backdropFileName = "rainy.jpg";
	} else if(condition.match(o.snow)) {
		backdropFileName = "snowy.jpg";
	} else if(condition.match(o.storm)) {
		backdropFileName = "stormy.jpg";
	}
    
    $(object).attr('src', "/weather/img/" + backdropFileName).addClass("fadein");
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
	$.fn.mcjsw.defaults = {
		datasetKey: 'mcjsweather' //always lowercase
		, backdropImageSelector: '.backdropimg'
		, forecastSelector: '.forecast'
    , baseApiUrl: 'http://api.wunderground.com/api/68a6ea8f6013979c/'

	};

})(jQuery);