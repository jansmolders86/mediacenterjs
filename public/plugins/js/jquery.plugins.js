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

	var pluginsChanged = false;

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
			_loadItems(o, true);
			
			$('.backlink').on('click',function(e) {
				if (!pluginsChanged) {
					document.location = '/';
				} else {
					e.preventDefault();	
					var dialog = $("<div>Restarting Server<br>Please wait<br><img src='/core/css/img/ajax-loader.gif'/></div>").dialog({
						resizable : false,
						modal: true,
						closeOnEscape: false,
						draggable: false,
						dialogClass: "restart-dialog"
					});
					dialog.dialog("open");
					$.ajax({
						url: '/plugins/reloadServer', 
						type: 'get',
						dataType: 'json'
					}).done(function(data){
						setTimeout(function(){
							document.location = '/';
						},4000);
					});
				}
			});
			
		});
	}
	
	/**** Start of custom functions ***/
	
	function _loadItems(o, showloading, callback){
		if (showloading) {
			$('.loading').show();
		}

		if (!o.viewModel) {
			// create initial viewmodel
			
			o.viewModel = {};
			o.viewModel.plugin = ko.observableArray();
			o.viewModel.message = ko.observable('');
			o.viewModel.upgradeAll = ko.observableArray([]);

			o.viewModel.upgradeAllPlugins = function(data){
				var requests = [];
				console.log(data)
				for(var i=0; i<data.length; i++){
					pluginsChanged = true;
					requests.push($.ajax({
						url: '/plugins/'+data[i]+'/upgrade', 
						type: 'get',
						dataType: 'json',
						beforeSend: function(){
								o.viewModel.message('Upgrading ' + data[i] + '...')
							}
						}).done(function(data){
							setTimeout(function(){
								o.viewModel.message(data.message);
								
							}, 1000);	 
					}));
				}
				$.when.apply($, requests).then(function(){
					o.viewModel.message('All plugins upgraded successfully');
					_loadItems(o, showloading, callback);
				});
			}

			ko.applyBindings(o.viewModel,o.$that[0]);
		}	
	
		$.ajax({
			url: '/plugins/loadItems', 
			type: 'get',
			dataType: 'json'
		}).done(function(data){	
			$('.message').fadeOut('slow');
			$('.loading').hide();
			
			if (data.message){
				o.viewModel.message(data.message);
			}else{
                $('.backlink').show();	
				var pluginList = [];
				$.each(data.plugins, function() {
					var plugin = new pluginModel(this, o);
					pluginList.push(plugin);
				});
				
				o.viewModel.plugin(pluginList);
				o.viewModel.plugin.sort();
				//o.viewModel.message('')
				o.viewModel.upgradeAll(data.upgradablePlugins);	
				callback();
							
			}

		});
	}
	
	var pluginModel = function (json, o) {
	

		var that 			= this;	
		var jqxhr;
		this.name 			= ko.observable(json.name);
		this.desc 			= ko.observable(json.desc);
		this.author			= ko.observable(json.author);
		this.date 			= ko.observable(json.date);
		this.version 		= ko.observable(json.version);
		this.isInstalled 	= ko.observable(json.isInstalled);
		this.isUpgradable	= ko.observable(json.isUpgradable);

		this.install = function () {
			pluginsChanged = true;
            $('.backlink').hide();
			jqxhr = $.ajax({
				url: '/plugins/'+json.name+'/install', 
				type: 'get',
				dataType: 'json',
				beforeSend: function(){
					o.viewModel.message('Installing ' + json.name + '...')
				}
			}).done(function(data){
				_loadItems(o, false, function() {
					o.viewModel.message(data.message);
				});
			});
		};

		this.upgrade = function () {
            pluginsChanged = true;
            $('.backlink').hide();
			jqxhr = $.ajax({
				url: '/plugins/'+json.name+'/upgrade', 
				type: 'get',
				dataType: 'json',
				beforeSend: function(){
					o.viewModel.message('Upgrading ' + json.name + '...')
				}
			}).done(function(data){
				_loadItems(o, false, function() {
					o.viewModel.message(data.message);
				});	 
			});
		};
		
		this.remove = function () {
			pluginsChanged = true;
            $('.backlink').hide();
			jqxhr = $.ajax({
				url: '/plugins/'+json.name+'/uninstall', 
				type: 'get',
				dataType: 'json',
				beforeSend: function(){
					o.viewModel.message('Uninstalling ' + json.name + '...')
				}
			}).done(function(data){
				_loadItems(o, false, function() {
					o.viewModel.message(data.message);
				});	 
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