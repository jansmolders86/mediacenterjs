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
				$that : $that
			});
			
			// use extend(), so no o is used by value, not by reference
			$.data(this, ns, $.extend(true, {}, o));
			
			$(o.backLinkSelector).on('click', function(e) {
				e.preventDefault();	
                _backHandler(o);
			});


            $(o.musicListSelector +'> li').on('click', function(e) {
                e.preventDefault();
                $(this).addClass(o.activeClass);
                $(this).find(o.trackListSelector).show();
                $(o.musicListSelector +'> li:not(.'+o.activeClass+')').hide();
            });

            $(o.trackListSelector +'> li').on('click', function(e) {
                e.preventDefault();

                $('.random').removeClass('active');
                var random = false;
                var album = $(this).parent().parent().find('span.title').text();
                var currentItem = $(this).attr('title');
                $('li.'+o.selectedClass).removeClass(o.selectedClass);
				$(this).addClass(o.selectedClass);

                var url = '/music/'+currentItem+'/'+album+'/play/';
                _playTrack(o,currentItem, album, random, url);
            });


		});
	}
    
	
	/**** Start of custom functions ***/


    function _backHandler(o){
        if (!$(o.musicListSelector+' > li').hasClass(o.activeClass)){
            window.location = '/';
        } else if ( $(o.musicListSelector+' > li').hasClass(o.activeClass)) {
            $(o.musicListSelector+' > li').removeClass(o.activeClass).show();
            $(o.trackListSelector).hide();
        }
    }


    /**** Start of playback functions ***/

    function _nextTrack(o,currentItem,album){
        var random = false;
        var activeItem = $('li.'+o.selectedClass).attr('title');
        var url = '/music/'+activeItem+'/'+album+'/next';

        $('li.'+o.selectedClass).removeClass(o.selectedClass).next('li').addClass(o.selectedClass);
        _playTrack(o,activeItem,album,random, url);

    }

    function _randomTrack(o, currentItem,album){
        var url = '/music/'+currentItem+'/'+album+'/random';
        var random = true;

        _playTrack(o,currentItem, album,random, url);
    }


    function _playTrack(o,currentItem,album,random,url){
        if(!$('.random').length){
            $(o.playerSelector).append('<div class="random hidden">Random</div>')
        }
        $('.random').removeClass('hidden');

        $(o.playerSelector).addClass('show');

        videojs(o.playerID).ready(function(){
            var myPlayer = this;

            myPlayer.src(url);
            myPlayer.play();

            $('.random').on('click tap', function(e) {
                if($(this).hasClass('active')){
                    $(this).removeClass('active');
                } else{
                    $(this).addClass('active');
                }

                _randomTrack(o,currentItem,album);
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

                    _nextTrack(o,currentItem,album);
                } else if(random === true){
                    _randomTrack(o,currentItem,album);
                }
            });
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
		}
	};
	
	/* default values for this plugin */
	$.fn.mcjsm.defaults = {
		datasetKey: 'mcjsmusic', //always lowercase
        musicListSelector : '.music',
        activeClass : 'mcjs-rc-active',
        backLinkSelector : '.backlink',
        selectedClass : 'selected',
        trackListSelector : '.tracks',
        playerID : 'player'
	};

})(jQuery);
