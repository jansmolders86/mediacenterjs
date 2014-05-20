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
function remote(socket, $scope, player, audio){
    var albums = $scope.albums;
    socket.on('controlling', function(data){
        switch(data.action) {
            case "goLeft" :
                goLeft(socket, $scope, player, audio);
                break;
            case "goRight" :
                goRight(socket, $scope, player, audio);
                break;
            case "enter" :
                pushEnter(socket, $scope, player, audio);
                break;
            case "pause" :
                pushPause(socket, $scope, player, audio);
                break;
            case "back" :
                pushBack(socket, $scope, player, audio);
                break;
            case "mute" :
                pushMute(socket, $scope, player, audio);   
                break;
            case "dashboard" :
                pushDashboard(socket, $scope, player, audio);
                break;
        }
    });
}


// Catch and set keyevents
function keyevents(socket, $scope, player, audio){
    document.onkeydown=onKeyDownHandler; 
    
    function onKeyDownHandler(e){
        if (typeof e == 'undefined' && window.event) { e = window.event; }

        switch(e.keyCode) {
            case 39 : //next
                goRight(socket, $scope, player, audio);
            break;
            case 37 : //prev
                goLeft(socket, $scope, player, audio);
            break;
            case 13 : //enter
                e.preventDefault();
                pushEnter(socket, $scope, player, audio);
            break;
            case 8  : //backspace
                pushBack(socket, $scope, player, audio);
            break;
            case 32 :  //space
                pushPause(socket, $scope, player, audio);
            break;
        }
    };
}


function goLeft(socket, $scope, player, audio){
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
    $scope.$apply(function(){
        $scope.focused;
    });
}


function goRight(socket, $scope, player, audio){
   if(player.playlist.length === 0) {
        var index = $scope.focused;
        index++;
        if (index >= $scope.albums.length) {
            index = 0;
        }
        $scope.focused = index;
    }else {
        player.next();
    } 
    $scope.$apply(function(){
        $scope.focused;
    });
}

function pushEnter(socket, $scope, player, audio){
    if(player.playlist.length === 0) {
        var index = $scope.focused;
        var album = $scope.albums[index];
        player.playlist.push(album);
    } else {
        player.play();
    }
}

function pushPause(socket, $scope, player, audio){
    if(player.playing === true) {
        player.pause();
    } else {
        player.play();
    }
}

function pushBack(socket, $scope, player, audio){
    if(!document.activeElement === input){
        e.preventDefault();
        if(player.playlist.length > 0) {
            var album = player.playlist[player.current.album];
            player.playlist.remove(album);
        } else {
            window.location = "/";
        }
    }
}

function pushMute(socket, $scope, player, audio){
    var mute = false;
    if(player.playing === true && mute === false) {
        audio.mute = true;
        mute = true;
    } else {
        audio.mute = false;
    }
}

function pushDashboard(socket, $scope, player, audio){
    window.location = "/";
}