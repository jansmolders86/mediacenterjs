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

    var musicApp = angular.module('musicApp', []);

    window.musicCtrl = function($scope, $http, player, socket, audio) {
        $scope.player = player;
        $scope.focused = 0;
        $http.get('/music/loadItems').success(function(data) {
            $scope.albums = data;
            remote(socket, $scope, player, audio);
            keyevents(socket, $scope, player, audio);
        });
        
        $scope.orderProp = 'genre';
    };

    musicApp.factory('audio', function($document) {
        var audio = $document[0].createElement('audio');
        return audio;
    });

    musicApp.factory('player', function(audio, socket, $rootScope) {
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

	    return player;
    });


    musicApp.factory('socket', function ($rootScope) {
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

})(window);