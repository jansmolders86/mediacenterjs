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

	var ns = 'mcjsp';
	var methods = {};

	function _init(options) {
		var opts = $.extend(true, {}, $.fn.mcjsp.defaults, options);
		return this.each(function() {
			var $that = $(this);
			var o = $.extend(true, {}, opts, $that.data(opts.datasetKey));
				
			// add data to the defaults (e.g. $node caches etc)	
			o = $.extend(true, o, { 
				$that: $that,
				pluginCache : []
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));

			_loadItems(o);
			
		});
	}
	
	/**** Start of custom functions ***/
	
	function _loadItems(o){
	
		if (!o.viewModel) {
			// create initial viewmodel
			console.log('asd')
			o.viewModel = {};
			o.viewModel.plugin = ko.observableArray();
			ko.applyBindings(o.viewModel,o.$that[0]);
		}	
	
		$.ajax({
			url: '/plugins/loadItems', 
			type: 'get',
			dataType: 'json'
		}).done(function(data){	
		
			$('.loading').hide();
			
			var pluginList = [];
			$.each(data, function() {
				var plugin = new pluginModel(this);
				pluginList.push(plugin);
			});
			
			o.viewModel.plugin(pluginList);
			o.viewModel.plugin.sort();
		});
	}
	
	var pluginModel = function (json) {
		var that 			= this;
		this.name 			= ko.observable(json.name);
		this.desc 			= ko.observable(json.desc);
		this.author			= ko.observable(json.author);
		this.date 			= ko.observable(json.date);
		this.version 		= ko.observable(json.version);
		this.isInstalled 	= ko.observable(json.isInstalled);
		this.isUpgradable	= ko.observable(json.isUpgradable);

		this.install = function () {
			$.ajax({
				url: '/plugins/'+json.name+'/install', 
				type: 'get',
				dataType: 'json'
			});
		};
		this.upgrade = function () {
			$.ajax({
				url: '/plugins/'+json.name+'/upgrade', 
				type: 'get',
				dataType: 'json'
			});
		};
		this.remove = function () {
			$.ajax({
				url: '/plugins/'+json.name+'/remove', 
				type: 'get',
				dataType: 'json'
			});
		};
	}

	/**** End of custom functions ***/
		
	$.fn.mcjsp = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || !method ) {
			return _init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.fn.mcjsp' );
		}
	};
	
	/* default values for this plugin */
	$.fn.mcjsp.defaults = {		
		datasetKey: 'mcjsp' //always lowercase
	};

})(jQuery);