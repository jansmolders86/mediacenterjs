
function videoJSHandler(playerID, data, url, title, homeURL, timeout){
    var player = videojs(playerID);
    player.ready(function() {

        setTimeout(function(){
            player.src({
                type    : "video/mp4", 
                src     : url 
            });

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
            var movieData = {
                'movieTitle': title,
                'currentTime': currentTime
            }
            postAjaxCall('/movies/sendState', movieData);
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
            } else{
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
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.setRequestHeader("Content-length", params.length);
    xmlhttp.setRequestHeader("Connection", "close");
    xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
           // callback(xmlhttp.responseText);
        }
    }
    xmlhttp.open("POST", url, true);
    xmlhttp.send(params);
}




