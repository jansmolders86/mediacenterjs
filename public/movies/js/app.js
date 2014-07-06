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

var movieApp = angular.module('movieApp', ['ui.bootstrap']);

movieApp.controller('movieCtrl', function($scope, $http, $modal) {
    $scope.focused = 0;
    $scope.serverMessage = 0;
    $scope.serverStatus= '';

    $http.get('/movies/loadItems').success(function(data) {
        $scope.movies = data;
    });

    $scope.playMovie = function(data){
        $scope.playing = true;
        playMovie(data, $http);
    }

    $scope.open = function (movie) {
        var modalInstance = $modal.open({
            templateUrl: 'editModal.html',
            controller: ModalInstanceCtrl,
            size: 'md',
            resolve: {
                current: function () {
                    return movie;
                }
            }
        });
    }

    var ModalInstanceCtrl = function ($scope, $modalInstance, current) {
        $scope.edit = {};
        $scope.current = current;

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.editItem = function(){
            if (!$scope.edit.title || $scope.edit.title === '') {
                $scope.edit.title = $scope.current.title || '';
            }

            if (!$scope.edit.poster_path || $scope.edit.poster_path === '') {
                if ($scope.current.poster_path) {
                    $scope.edit.poster_path = $scope.current.poster_path;
                } else {
                    $scope.edit.poster_path = '/movies/css/img/nodata.png';
                }
            }

            if (!$scope.edit.backdrop_path || $scope.edit.backdrop_path === '') {
                if ($scope.current.backdrop_path) {
                    $scope.edit.backdrop_path = $scope.current.backdrop_path;
                } else {
                    $scope.edit.backdrop_path = '/movies/css/img/backdrop.png';
                }
            }

            $http({
                method: "post",
                data: {
                    newTitle            : $scope.edit.title,
                    newPosterPath       : $scope.edit.poster_path,
                    newBackdropPath     : $scope.edit.backdrop_path,
                    currentMovie        : $scope.current.original_name
                },
                url: "/movies/edit"
            }).success(function(data, status, headers, config) {
                location.reload();
            });
        }
    };

    $scope.changeSelected = function(movie){
        var selectedMovie = $scope.movies.indexOf(movie);

        if ($scope.focused !== selectedMovie) {
            var elem = document.getElementById("backdropimg");
            elem.src = movie.backdrop_path;
            $scope.focused = selectedMovie;
        }
    }

    $scope.resetSelected = function () {
        $scope.focused = 0;

        var elem = document.getElementById("backdropimg");
        elem.src = '/movies/css/img/backdrop.png';
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

function playMovie(data, $http){
    var orginalName = data;

    var platform = 'desktop';
    if (navigator.userAgent.match(/Android/i)) {
        platform = 'android';
    } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
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
