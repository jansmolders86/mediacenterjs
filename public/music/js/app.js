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

(function(window) {

    var musicApp = angular.module('musicApp', ['ui.bootstrap']);

    window.musicCtrl = function($scope, $http, player, $modal, audio) {
        $scope.player = player;
        $scope.focused = 0;
        $http.get('/music/loadItems').success(function(data) {
            $scope.albums = data;
        });

        $scope.changeSelected = function(album){
            $scope.focused = $scope.albums.indexOf(album);
        }


        $scope.open = function (album) {
            var modalInstance = $modal.open({
                templateUrl: 'editModal.html',
                controller: ModalInstanceCtrl,
                size: 'md',
                resolve: {
                    current: function () {
                        return album;
                    }
                }
            });
        }

        var ModalInstanceCtrl = function ($scope, $modalInstance, current) {
            $scope.edit ={};
            $scope.current = current;

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.editItem = function(){

                if($scope.edit.artist === '' || $scope.edit.artist === null || $scope.edit.artist === undefined ){
                    if($scope.current.artist  !== undefined || $scope.current.artist !== null){
                        $scope.edit.artist = $scope.current.artist;
                    } else {
                        $scope.edit.artist = '';
                    }
                }

                if($scope.edit.title === '' || $scope.edit.title === null || $scope.edit.title === undefined ){
                    if($scope.current.album  !== undefined || $scope.current.album !== null){
                        $scope.edit.title = $scope.current.album;
                    } else {
                        $scope.edit.title = '';
                    }
                }

                if($scope.edit.thumbnail === '' || $scope.edit.thumbnail === null || $scope.edit.thumbnail === undefined ){
                    if($scope.current.cover  !== undefined || $scope.current.cover !== null){
                        $scope.edit.thumbnail = $scope.current.cover;
                    } else {
                        $scope.edit.thumbnail = '/music/css/img/nodata.jpg';
                    }
                }

                $http({
                    method: "post",
                    data: {
                        newArtist    : $scope.edit.artist,
                        newTitle     : $scope.edit.title,
                        newThumbnail : $scope.edit.thumbnail,
                        currentAlbum : $scope.current.album
                    },
                    url: "/music/edit"
                }).success(function(data, status, headers, config) {
                    location.reload();
                });
            }
        };



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
                $scope.remote       = remote(data, $scope, player, audio);
                $scope.keyevents    = keyevents(data, $scope, player, audio);
            }
        });

        $scope.orderProp = 'genre';
    };


    musicApp.factory('audio', function($document) {
        var audio = $document[0].createElement('audio');
        return audio;
    });

    musicApp.factory('player', function(audio,  $rootScope) {
        var player,
            playlist = [],
            paused = false,
            current = {
                album: 0,
                track: 0
            };

        player = {
            playlist: playlist,
            current: current,
            playing: false,
            play: function(track, album) {
                if (!playlist.length) return;

                if (angular.isDefined(track)) current.track = track;
                if (angular.isDefined(album)) current.album = album;

                if (!paused) audio.src = 'music/'+playlist[current.album].tracks[current.track].filename +'/play/';
                audio.play();
                player.playing = true;
                paused = false;
            },
            pause: function() {
                if (player.playing) {
                    audio.pause();
                    player.playing = false;
                    paused = true;
                }
            },
            reset: function() {
                player.pause();
                current.album = 0;
                current.track = 0;
            },
            next: function() {
                if (!playlist.length) return;
                paused = false;
                if (playlist[current.album].tracks.length > (current.track + 1)) {
                    current.track++;
                } else {
                    current.track = 0;
                    current.album = (current.album + 1) % playlist.length;
                }
                if (player.playing) player.play();
            },
            previous: function() {
                if (!playlist.length) return;
                paused = false;
                if (current.track > 0) {
                    current.track--;
                } else {
                    current.album = (current.album - 1 + playlist.length) % playlist.length;
                    current.track = playlist[current.album].tracks.length - 1;
                }
                    if (player.playing) player.play();
            }
        };

        playlist.add = function(album) {
            if (playlist.indexOf(album) != -1) return;
            playlist.push(album);
        };

        playlist.remove = function(album) {
            var index = playlist.indexOf(album);
            if (index == current.album) player.reset();
            playlist.splice(index, 1);
        };

        audio.addEventListener('ended', function() {
            $rootScope.$apply(player.next);
        }, false);

        audio.addEventListener("timeupdate", function(){
            updateProgress(audio);
        }, false);

        return player;
    });

    function updateProgress(audio) {
       var progress = document.getElementById("progress");
       var value = 0;
       if (audio.currentTime > 0) {
          value = Math.floor((100 / audio.duration) * audio.currentTime);
       }
       progress.style.width = value + "%";
    }

})(window);

