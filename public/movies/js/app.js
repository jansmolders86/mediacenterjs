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

var movieApp = angular.module('movieApp', [
    'movieApp.scroll'
]);

movieApp.controller('movieCtrl', function($scope, $http) {
    $scope.focused = 0;
    $http.get('/movies/loadItems').success(function(data) {
        $scope.movies = data;
        $scope.orderProp = 'genre';
        $scope.playMovie = function(data){
            $scope.playing = true;
            playMovie(data, $http);
        }

        $scope.changeBackdrop = function(backdrop){
            var elem = document.getElementById("backdropimg");
            elem.src = backdrop;
        }
        
        var setupSocket = {
            async: function() {
                var promise = $http.get('/configuration/').then(function (response) {
                    var configData  = response.data;
                    var socket      = io.connect(configData.localIP + ':'+configData.remotePort);
                    socket.on('connect', function(data){
                        socket.emit('screen');
                    });
                    return {
                        on: function (eventName, callback) {
                            socket.on(eventName, function () {
                                var args = arguments;
                                $scope.$apply(function () {
                                    callback.apply(socket, args);
                                });
                            });             

                        },
                        emit: function (eventName, data, callback) {
                            socket.emit(eventName, data, function () {
                                var args = arguments;
                                $scope.$apply(function () {
                                    if (callback) {
                                        callback.apply(socket, args);
                                    }
                                });
                            });
                        }
                    };
                    return data;
                });
                return promise;
            }
        };
        
        setupSocket.async().then(function(data) {
            if (typeof data.on !== "undefined") {
                $scope.remote       = remote(data, $scope);
                $scope.keyevents    = keyevents(data, $scope);
            }
        });

    });
});

function playMovie(data, $http){
    var orginalName = data;
    
    var platform = 'desktop';
    if (navigator.userAgent.match(/Android/i)){
        platform = 'android';
    } else if(navigator.userAgent.match(/iPhone/i)
            || navigator.userAgent.match(/iPhone/i)
            || navigator.userAgent.match(/iPad/i)
            || navigator.userAgent.match(/iPod/i))
    {
        platform = 'ios';    
    }

    $http.get('/movies/'+orginalName+'/play/'+platform).success(function(data) {
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