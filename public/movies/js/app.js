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

var movieApp = angular.module('movieApp', []);

movieApp.controller('movieCtrl', function($scope, $http,$document,$window, socket) {
    $scope.focused = 0;
    $http.get('/movies/loadItems').success(function(data) {
        $scope.movies = data;
        remote(socket, $scope);
        keyevents(socket, $scope);
    });
    
    $scope.orderProp = 'genre';
                                     
    $scope.playMovie = function(data){
        $scope.playing = true;
        playMovie(data, $http);
    }
    
    $scope.changeBackdrop = function(backdrop){
        var elem = document.getElementById("backdropimg");
        elem.src = backdrop;
    }
});


movieApp.directive("scroll", function ($document,$window) {
    return function($scope, element, attrs) {
       angular.element($window).bind("scroll", function() {
             if (this.pageYOffset >= 100) {
                 $scope.boolChangeClass = true;
             } else {
                 $scope.boolChangeClass = false;
             }
            $scope.$apply();
        });
    };
});

movieApp.factory('socket', function ($rootScope) {
    var socket = io.connect('http://127.0.0.1:3001');
    socket.on('connect', function(data){
        socket.emit('screen');
    });
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});

function playMovie(data, $http){
    var orginalName = data;
    $http.get('/movies/'+orginalName+'/play').success(function(data) {

        var fileName                =  orginalName   
            , outputFile            =   fileName.replace(/ /g, "-")
            , extentionlessFile     =   outputFile.replace(/\.[^/.]+$/, "")
            , videoUrl              =   "/data/movies/"+extentionlessFile+".mp4"
            , subtitleUrl           =   "/data/movies/"+extentionlessFile+".srt"  
            , playerID              =   'player'
            , homeURL               =   '/movies/';

        videoJSHandler(playerID, data, videoUrl, subtitleUrl, orginalName,homeURL, 5000);

    });  
}