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

	var ns = 'mcjsm';
	var methods = {};

	function _init(options) {
		var opts = $.extend(true, {}, $.fn.mcjsm.defaults, options);
		return this.each(function() {
			var $that = $(this);
			var o = $.extend(true, {}, opts, $that.data(opts.datasetKey));
				
			// add data to the defaults (e.g. $node caches etc)	
			o = $.extend(true, o, { 
				musicCache : [],
				$that : $that,
                music : undefined,
				tracks : new Array,
                currentAlbum : undefined
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			_setViewmodel(o);
			_loadItems(o);
			
			$(o.musicListSelector).scroll( function(){
				_lazyload(o);
			});
			_lazyload(o);
			
			$(o.backLinkSelector).on('click', function(e) {
				e.preventDefault();	
                _backHandler(o);
			});
		});
	}
    
	
	/**** Start of custom functions ***/
    
    
    /**** Set viewmodel ***/
    
	var Music = function (o, json) {
		var self            = this;
		self.localName 	    = ko.observable(json);
		self.thumbnail	    = ko.observable();
		self.isSingle	    = ko.observable(false);
		self.title		    = ko.observable();
		self.year 		    = ko.observable();
		self.genre 		    = ko.observable();
        self.viewDetails    = ko.observable(false);
		self.tracks 	    = ko.observableArray();
		self.showAlbum  = function () {
            self.viewDetails(false);
			var album = self.localName();
            o.currentAlbum = album;
            
            if(self.isSingle() === true){
                _playSingle(o, album);
			} else {
                self.viewDetails(true);
                if(self.viewDetails(true) ){
                    $(o.musicListSelector+' > li').hide();
                }

            }
		};
	}
    
    var Track = function (o, data) {
        var self            = this;
        self.name           = data;
        self.isActive       = ko.observable(false);
        self.playTrack  	= function () {
            //todo: check current active by name (data)
            if(self.isActive(true)){
                self.isActive(false);
            }
            self.isActive(true);
            var trackname = self.name;
            _trackClickHandler(o, trackname);


        };
    }
	
	function _setViewmodel(o){
		if (!o.viewModel) {
			o.viewModel = {};
			o.viewModel.music = ko.observableArray();
			ko.applyBindings(o.viewModel,o.$that[0]);
		}	
	}
    
    function _backHandler(o){
        if (!$(o.musicListSelector+' > li').hasClass('active')){	
            window.location = '/';
        } else if ( $(o.musicListSelector+' > li').hasClass('active')) {
            $(o.musicListSelector+' > li').removeClass('active').show();
            $('body').removeClass('albumview');
        }
    }
	
	function _loadItems(o){
		$.ajax({
			url: '/music/loadItems', 
			type: 'get',
			dataType: 'json'
		}).done(function(data){	
			var listing = [];
			$.each(data, function () {
				// create movie model for each movie
				o.music = new Music(o, this);
				listing.push(o.music);
				
				// add model to cache
				o.musicCache[this] = o.music;
			});
			o.viewModel.music(listing);
			o.viewModel.music.sort();

            _lazyload(o);
            
		});	
	}
	
	function _lazyload(o){
		if($(o.playerSelector).hasClass('show')){
			$(o.playerSelector).removeClass('show')
		};
		//Set timeout for fast scrolling
		setTimeout(function(){
			var WindowTop = $(o.musicListSelector).scrollTop()
			, WindowBottom = WindowTop + $(o.musicListSelector).height();

			$(o.musicListSelector).find('li').each(function(){
				var offsetTop = $(this).offset().top
				, offsetBottom = offsetTop + $(this).height();

				//if(!$(this).attr("loaded") && WindowTop <= offsetBottom && WindowBottom >= offsetTop){
					var title = $(this).find('.title').html()
					, currentAlbum = $(this);
					
					_handleMusic(o, title, currentAlbum);
					$(this).attr("loaded",true);
				//}
			});		
		},500);	
	}
	
	function _handleMusic(o, title, currentAlbum){
		$.ajax({
			url: '/music/'+title+'/info/', 
			type: 'get'
		}).done(function(data){
			if (o.musicCache[title]) {
				setTimeout(function(){
					var musicData = data[0];
                    o.music = o.musicCache[title];
					
					o.music.thumbnail(musicData.cover);
					o.music.year(musicData.year);
					o.music.genre(musicData.genre);
					o.music.title(musicData.title);
                    var array = [];
                    
                    if(musicData.tracks.length === 0){
                        o.music.isSingle(true);
                    } else{
                        $.each(musicData.tracks,function (index, value) {
                            var trackName = value;
                            var track = new Track(o, trackName);
                            array.push(track);
                        });
                        o.music.tracks(array);
                    }
                    
					currentAlbum.addClass('coverfound');
					
				},500);
			}
		});
	}
    
    /*** Remote extension ***/
    
    function _remoteControlExtention(o){
        //Remote Control extender
        if(io !== undefined){
            $.ajax({
                url: '/configuration/', 
                type: 'get'
            }).done(function(data){
                var socket = io.connect(data.localIP+':'+data.remotePort);
                socket.on('connect', function(data){
                    socket.emit('remote');
                });

                socket.on('controlling', function(data){
                    var focused = $('.'+o.focusedClass)
                    ,accesibleItem = $('li.mcjs-rc-tracklist-control');

                    if(data.action === "enter"){ 
                        var currentItem = focused;
                        if(focused.length > 0){
                            _trackClickHandler(o, currentItem);
                        }
                    }
                    
                    if(data.action === "shuffle"){ 
                        _randomTrack(o);
                    }
                    
                    if(data.action === "back"){ 
                        _backHandler(o);
                    }

                });
            });
        }	
    }
	
    /*** Playback Handling ***/
    
    function _playSingle(o, album){
        var track = '/music/none/'+album+'/play'
        , songTitle = album
        , random = false
        , album = 'none';
        
        //$(".title:contains('"+self.localName()+"')").parent('li').addClass(o.selectedClass);
        _playTrack(o,track,album,songTitle,random);
    }
    
    
	function _trackClickHandler(o, currentItem){
		$('.random').removeClass('active');
        var album = o.currentAlbum 
		, track = '/music/'+ album +'/'+currentItem+'/play/'
		, random = false
        , songTitle = currentItem;
        
		_playTrack(o,track,album,songTitle,random);
	}	
	
	function _playTrack(o,track,album,songTitle,random){
		if(!$('.random').length){
			$(o.playerSelector).append('<div class="random hidden">Random</div>')
		}
		$('.random').removeClass('hidden');
		
		$(o.playerSelector).addClass('show');

		videojs(o.playerID).ready(function(){
			var myPlayer = this;

			myPlayer.src(track);
			myPlayer.play();
			
			$('.random').on('click tap', function(e) {
				if($(this).hasClass('active')){
					$(this).removeClass('active');
				} else{
					$(this).addClass('active');
				}

				_randomTrack(o);
			});
			
			myPlayer.on("pause", function(){
				if($('.boxed').hasClass('playing')){
					$('.boxed.playing.selected').addClass('pause')
				} else {
					$('.'+o.selectedClass+' > .eq').addClass('pause');
				}
			});
			
			myPlayer.on("play", function(){
				if($('.boxed').hasClass('playing')){
					$('.boxed.playing.selected').removeClass('pause')
				} else {
					$('.'+o.selectedClass+' > .eq').removeClass('pause');
				}
			});
			
			myPlayer.on("ended", function(){
				if(random === false){
					$('.random').removeClass('active');
					_nextTrack(o,album,songTitle);
				} else if(random === true){
					_randomTrack(o);
				}
			});
		});
	}
	
	function _nextTrack(o,album,songTitle){		
		var random = false;
		
		index = o.tracks.indexOf(songTitle);
		if(index >= 0 && index < o.tracks.length - 1){
		   nextItem = o.tracks[index + 1];
		   songTitle = nextItem;
		} else{
			return;
		}		

		var track = '/music/'+album+'/'+nextItem+'/play';
		
		$('li.'+o.selectedClass).removeClass(o.selectedClass);
		$(o.trackListSelector).find('li:contains('+nextItem+')').addClass(o.selectedClass);

		_playTrack(o,track,album,songTitle,random);
	}
	
	function _randomTrack(o){
		$('li.'+o.selectedClass).removeClass(o.selectedClass);
	
		var random = true
		, elemLength = o.tracks.length
		, randomNum = Math.floor(Math.random()*elemLength)
		, nextItem = o.tracks[randomNum];
		
		$(o.trackListSelector).find('li:contains('+nextItem+')').addClass(o.selectedClass);
		
		var track = '/music/'+album+'/'+nextItem+'/play';
		
		_playTrack(o,track,album,songTitle,random);
	}
	
	/**** End of custom functions ***/
	
	$.fn.mcjsm = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || !method ) {
			return _init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.fn.mcjsm' );
		}
	};
	
	/* default values for this plugin */
	$.fn.mcjsm.defaults = {
		datasetKey: 'mcjsmusic' //always lowercase
		, musicListSelector: '.music' 
		, trackListSelector: '#tracklist' 
		, playerSelector: '#player' 
		, headerSelector: '#header' 
		, backLinkSelector: '.backlink' 
		, playerID: 'player' 
		, selectedClass: 'selected' 
		, focusedClass: 'focused' 
	};

})(jQuery);
