
function videoJSHandler(playerID, data, url, title, homeURL, timeout){
    setTimeout(function(){
        var setup = {
            'techOrder' : ['html5'],
            'controls'  : true,
            'preload'   : 'auto',
            'autoplay'  : false
        };


        videojs(playerID, setup, function(){
            this.src({
                type : "video/mp4", 
                src: url 
            });


            var setProgression = parseFloat(data.progression);
            this.currentTime(setProgression);
            this.play();

            _setDurationOfMovie(videojs, data);
            _pageVisibility(playerID); 

        });

        var currentTime = parseFloat(data.progression);
        videojs.on('error', function(e){
                console.log('Error', e);
            });

            videojs.on('timeupdate', function(e){
                _setDurationOfMovie(this, data);
            });

            videojs.on('progress', function(e){
                _setDurationOfMovie(this, data);
            });

            videojs.on('pause', function(e){
                currentTime = player.currentTime();
                var movieData = {
                    'movieTitle': title,
                    'currentTime': currentTime
                }
                $.ajax({
                    url: '/movies/sendState',
                    type: 'post',
                    data: movieData
                });
            });

            videojs.on('loadeddata', function(e){
                _setDurationOfMovie(this, data);
                if(currentTime > 0){
                    this.currentTime(currentTime);
                }
            });

            player.on('loadedmetadata', function(e){
                if(currentTime > 0){
                    this.currentTime(currentTime);
                }
            });

            videojs.on('ended', function(e){
                currentTime = this.currentTime();
                var actualDuration = data.duration;
                if( currentTime < actualDuration){
                    this.load();
                    this.play();
                } else{
                    this.dispose();
                    window.location.replace(homeURL);
                }
            });

    },timeout);
}



function _setDurationOfMovie(player, data){
    var videoDuration = player.duration(data.duration);
    player.bufferedPercent(0);
    // TODO: Update time with angular 
    // $('.vjs-duration-display .vjs-control-text').text(videoDuration);
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