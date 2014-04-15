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

/**

    Generic plain javascript VideoJS handler with events specifically for the way MCJS handles video playback and saving playback state.

    @param playerID     ID of video element in DOM
    @param data         Callback from ajaxcall to get video specifications (eg. a JSON with movietitle, duration and subtitle)
    @param videoUrl     URL of transcoded file
    @param subtitleUrl  URL of copied subtitle
    @param title        Filename of video
    @param homeURL		Redirect url 
    @param timeout		Timeout before starting playback
    
 **/

function videoJSHandler(playerID, data, videoUrl, subtitleUrl, title, homeURL, timeout){
    var player = videojs(playerID);
    player.ready(function() {

        setTimeout(function(){
            player.src({
                type    : "video/mp4", 
                src     : videoUrl 
            });
            
            if(data.subtitle === true){
                var track = document.createElement("track");
                track.src = subtitleUrl
                track.label = 'Subtitle'
                document.getElementById(playerID).appendChild(track);
            }

            var setProgression = parseFloat(data.progression);
            player.currentTime(setProgression);
            player.play();

            _setDurationOfMovie(player, data);
            _pageVisibility(playerID); 
        },timeout);

    });

    var currentTime = parseFloat(data.progression);
    player.on('error', function(e){
        console.log('Error', e);
    });

    player.on('timeupdate', function(e){
        _setDurationOfMovie(player, data);
    });

    player.on('progress', function(e){
        _setDurationOfMovie(player, data);
    });

    player.on('pause', function(e){
        currentTime = player.currentTime();

        if(title !== undefined && currentTime !== undefined ){
           var movieData = {
                'movieTitle': title,
                'currentTime': currentTime
            }
            postAjaxCall('/movies/sendState', movieData);
        }
 
    });

    player.on('loadeddata', function(e){
        _setDurationOfMovie(player, data);
        if(currentTime > 0){
            player.currentTime(currentTime);
        }
    });

    player.on('loadedmetadata', function(e){
        if(currentTime > 0){
            player.currentTime(currentTime);
        }
    });

    player.on('ended', function(e){
        currentTime = this.currentTime();
        var actualDuration = data.duration;
        if( currentTime < actualDuration){
            player.load();
            player.play();
        } else {
            player.dispose();
            window.location.replace(homeURL);
        }
    });
    
}



function _setDurationOfMovie(player, data){
    var videoDuration = player.duration(data.duration);
    player.bufferedPercent(0); 
}

function _pageVisibility(playerID){
    var hidden, visibilityChange;
    if (typeof document.hidden !== "undefined") {
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.mozHidden !== "undefined") {
        hidden = "mozHidden";
        visibilityChange = "mozvisibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }

    function handleVisibilityChange(playerID) {
        if (document[hidden]) {
            videojs(playerID).pause();
        } else if (sessionStorage.isPaused !== "true") {
            videojs(playerID).play();
        }
    }

    if (typeof document.addEventListener === "undefined" || typeof hidden === "undefined") {
        console.log("The Page Visibility feature requires a browser such as Google Chrome that supports the Page Visibility API.");
    } else {
        document.addEventListener(visibilityChange, handleVisibilityChange, false);
    }
}


function postAjaxCall(url, params){
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", url, true);
    xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xmlhttp.send(params);
}




