function remote(socket, $scope, player, audio){
    var albums = $scope.albums;
    socket.on('controlling', function(data){
        switch(data.action) {
            case "goLeft" :
                if(player.playlist.length === 0){
                    var index = $scope.focused;
                    index--;
                    if (index <= 0 ){
                        index = 0;
                    }
                    $scope.focused = index;
                } else {
                    player.previous();
                }
                break;
            case "goRight" :
                if(player.playlist.length === 0) {
                    var index = $scope.focused;
                    index++;
                    if (index >= albums.length) {
                        index = 0;
                    }
                    $scope.focused = index;
                }else {
                    player.next();
                }
                break;
            case "enter" :
                if(player.playlist.length === 0) {
                    var index = $scope.focused;
                    var album = albums[index];
                    player.playlist.push(album);
                } else {
                    player.play();
                }
                break;
            case "pause" :
                if(player.playing === true) {
                    player.pause();
                } else {
                    player.play();
                }
                break;
            case "back" :
                if(player.playlist.length > 0) {
                    var album = player.playlist[player.current.album];
                    player.playlist.remove(album);
                } else {
                    window.location = "/";
                }
                break;
            case "mute" :
                var mute = false;
                if(player.playing === true && mute === false) {
                    audio.mute = true;
                    mute = true;
                } else {
                    audio.mute = false;
                }
                break;
            case "dashboard" :
                window.location = "/";
                break;
        }
    });
}