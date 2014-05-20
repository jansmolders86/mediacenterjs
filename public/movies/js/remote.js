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
function remote(socket, $scope){
    socket.on('controlling', function(data){
        switch(data.action) {
            case "goLeft" :
                goLeft(socket, $scope);
                break;
            case "goRight" :
                goRight(socket,$scope);
                break;
            case "enter" :
                pushEnter(socket,$scope);
                break;
            case "pause" :
                pushPause(socket,$scope);
                break;
            case "back" :
                pushBack(socket,$scope);
                break;
            case "mute" :
                pushMute(socket,$scope);   
                break;
            case "dashboard" :
                pushDashboard(socket,$scope);
                break;
        }
    });
}


// Catch and set keyevents
function keyevents(socket, $scope){
    document.onkeydown=onKeyDownHandler; 
    
    function onKeyDownHandler(e){
        
        if (typeof e == 'undefined' && window.event) { e = window.event; }

        switch(e.keyCode) {
            case 39 :   //next
                goRight(socket, $scope);
            break;
            case 37 :   //prev
                goLeft(socket, $scope);
            break;
            case 13 :   //enter
                e.preventDefault();
                pushEnter(socket, $scope);
            break;
            case 8  :   //backspace
                pushBack(socket, $scope);
            break;
            case 32 :   //space
                pushPause(socket, $scope);
            break;
        }
    };
}


function goLeft(socket, $scope){
    var index = $scope.focused;
    index--;
    if (index <= 0 ){
        index = 0;
    }
    $scope.focused = index;
    $scope.$apply(function(){
        $scope.focused;
    });
}


function goRight(socket, $scope){
    var index = $scope.focused;
    index++;
    if (index >= $scope.movies.length) {
        index = 0;
    }
    $scope.focused = index;
    $scope.$apply(function(){
        $scope.focused;
    });
}

function pushEnter(socket, $scope){
    $scope.playMovie($scope.movies[$scope.focused].original_name);
}

function pushPause(socket, $scope){
    if($scope.playing === true) {
        videojs("player").pause();
    } else {
        videojs("player").play();
    }
}

function pushBack(socket, $scope){
    if(!document.activeElement === input){
        e.preventDefault();
        if($scope.playing === true) {
            videojs("player").destroy();
            window.location = "/movies/";
        } else {
            window.location = "/";
        }
    }
}

function pushMute(socket, $scope){
    if($scope.playing === true) {
        if(videojs("player").volume() === 0){
            videojs("player").volume(1)
        } else {
            videojs("player").volume(0);
        }
    }
}

function pushDashboard(socket, $scope, player, audio){
    window.location = "/";
}


