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
'use strict';

var movieApp = angular.module('movieApp', ['ui.bootstrap', 'mcjsCore']);

movieApp.config(function($logProvider){
    $logProvider.debugEnabled(true);
});

movieApp.service('mcjsMediaPlayer', function (angSocket) {
    angSocket.on("controlling", function (data) {
        var player = videojs("player");
        switch (data.action) {
            case "pause" :
                if (player.paused() === false) {
                    player.pause();
                } else {
                    player.play();
                }
                break;
            case "fullscreen" :
                if (player.isFullScreen) {
                    player.requestFullScreen();
                } else {
                    player.exitFullScreen();
                }
                break;
            case "mute" :
                player.muted(!player.muted());
                break;
        }
    });
    return {
        playing : false,
        videoJSHandler :  videoJSHandler
    };
});

movieApp.controller('movieCtrl', function($scope, $http, $modal, Movie, angSocket, mcjsMediaPlayer) {
    $scope.focused = null;
    $scope.serverMessage = 0;
    $scope.serverStatus= '';
    $scope.mediaPlayer = mcjsMediaPlayer;

    Movie.all()
    .then(function (movies) {
        $scope.movies = movies;
    });

    $scope.remote       = remote(angSocket, $scope);
    //$scope.keyevents    = keyevents(angSocket, $scope);


    angSocket.on('progress', function (data) {
        $scope.serverMessage = data.msg;
    });

    angSocket.on('serverStatus', function (data) {
        $scope.serverStatus = data.msg;
    });
});
