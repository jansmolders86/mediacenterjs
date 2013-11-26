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
				cloudy : '',
				mist : '',
				clear : '',
				sunny : '',
				rain : '',
				snow : '',
				storm : '',
				feelsLike : '',
				tempIndicator  : '&#8451;',
				error  : ''
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
	
			_currentweather(o, $(this))
			
		});
	}
	
	/**** Start of custom functions ***/
	
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
	
	// Get Current weather
	function _currentweather(o, $that){
		$.ajax({
			url: '/configuration/', 
			type: 'get'
		}).done(function(data){
		
			o.location = data.location
			o.language = data.language
			
			//Set up i18n translation
			$.i18n.properties({
				name: 'translation', 
				path:'/translations/frontend/', 
				mode:'map',
				language: data.language,
				extension: 'js',
				loadBaseFile: false ,
				callback: function() {
					o.cloudy = new RegExp('cloudy',"gi");
					o.partly_cloudy = new RegExp('partlycloudy',"gi");
					o.mist = new RegExp('mist',"gi");
					o.clear = new RegExp('clear',"gi");
					o.sunny = new RegExp('sunny',"gi");
					o.rain = new RegExp('rain',"gi");
					o.snow = new RegExp('snow',"gi");
					o.storm = new RegExp('storm',"gi");
					o.feelsLike = $.i18n.prop('feelsLike');
					o.error = $.i18n.prop('error_weather');
          o.LANG = $.i18n.prop('weather_underground_languagecode')
          
          $(".current h2").html($.i18n.prop('weather_current'));

					$.ajax({
						url : "http://api.wunderground.com/api/68a6ea8f6013979c/geolookup/conditions/lang:"+o.LANG+"/q/"+ o.language +"/"+ o.location+".json",
						dataType : "jsonp",
						success : function(parsed_json) {
							if (parsed_json['response']['error']){
								var errorMessage = parsed_json['response']['error']['description']
								$("body").find("h1").html(errorMessage);
							}else {
								var locations = parsed_json['location']['city'];
								var country = parsed_json['location']['country'];
								var weathertype = parsed_json['current_observation']['weather'];
								var weathericon = parsed_json['current_observation']['icon_url'];
								
								if (o.language === 'en'){
									var feelslike_c = parsed_json['current_observation']['feelslike_f'];
									var temp_c = parsed_json['current_observation']['temp_f'];
									o.tempIndicator  = '&#8457;' 
								} else{
									var feelslike_c = parsed_json['current_observation']['feelslike_c'];
									var temp_c = parsed_json['current_observation']['temp_c'];
								}
			
								$("body").find("h1").html( locations +", "+ country);
								$("body").find(".weathertype .text").html(weathertype);
								$("body").find(".degrees").html( temp_c + " <sup>"+o.tempIndicator+"</sup>");
								$("body").find(".feelslike").html( o.feelsLike +" "+ feelslike_c + " <sup>"+o.tempIndicator+"</sup>");
			
								var weathertypeset = parsed_json['current_observation']['icon'];
						    
                _setConditionIcon(o, $("body").find(".weathertype .icon"), weathertypeset);
                
								if ( weathertypeset.match(o.cloudy) ){
									$(o.backdropImageSelector).attr('src', "/weather/img/clouds.jpg").addClass("fadein");
								}else if( weathertypeset.match(o.mist) ){
									$(o.backdropImageSelector).attr('src', "/weather/img/misty.jpg").addClass("fadein");
								}else if( weathertypeset.match(o.clear) ){
									$(o.backdropImageSelector).attr('src', "/weather/img/clear.jpg").addClass("fadein");
								}else if( weathertypeset.match(o.sunny) ){
									$(o.backdropImageSelector).attr('src', "/weather/img/sunny.jpg").addClass("fadein");
								}else if( weathertypeset.match(o.rain) ){
									$(o.backdropImageSelector).attr('src', "/weather/img/rainy.jpg").addClass("fadein");
								}else if( weathertypeset.match(o.snow) ){
									$(o.backdropImageSelector).attr('src', "/weather/img/snowy.jpg").addClass("fadein");
								}else if( weathertypeset.match(o.storm) ){
									$(o.backdropImageSelector).attr('src', "/weather/img/stormy.jpg").addClass("fadein");
								}else {
									$(o.backdropImageSelector).attr('src', "/weather/img/default.jpg").addClass("fadein");
								}
							}
						},
						error : function() {
							$("body").find("h1").html( 'Error: ' + o.location + '<br/>' + o.error);
						}
					});
					
					$(o.forecastSelector).find("ul").remove()
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
									var conditions = day.icon
									
									
									if (o.language === 'en'){
										var mintemp = day.low.fahrenheit	
										var maxtemp = day.high.fahrenheit
                    o.tempIndicator  = '&#8457;';
									} else {
										var mintemp = day.low.celsius	
										var maxtemp = day.high.celsius
									}
                  
									$(o.forecastSelector).append('<li> <div class="weekday">'+ weekday +'</div> <div class="conditions" style="" data-weatherType="'+conditions+'"></div>  <div class="mintemp"> Min: ' + mintemp + ' ' + o.tempIndicator + '</div>  <div class="maxtemp"> Max: ' + maxtemp + ' ' + o.tempIndicator + '</div> </li>');	
								}
								
								
								$(o.forecastSelector).find('li').each(function(){
									var weatherType = $(this).find('.conditions').attr('data-weatherType');
									_setConditionIcon(o, $(this).find('.conditions'), weatherType);
								});
							})
						}
					});
				}
			});	
		}); 
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

	};

})(jQuery);