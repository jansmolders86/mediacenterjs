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

var tvApp = angular.module('tvApp', []);

tvApp.controller('tvCtrl', function($scope, $http, player){
    $scope.player = player;
    $scope.focused = 0;
    $http.get('/tv/loadItems').success(function(data) {
        $scope.tvshows = data;
    });
    
    $scope.orderProp = 'genre';
                  
    $scope.playEpisode = function(data){
        $scope.playing = true;
        playEpisode(data, $http);
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
            $scope.remote       = remote(data, $scope, player);
            $scope.keyevents    = keyevents(data, $scope, player);
        }
    });
    
    
});


tvApp.factory('player', function( $rootScope) {
        var player,
            playlist = [],
            current = {
                tvshow: 0,
                episode: 0
            };

	    player = {
            playlist: playlist,
            current: current,
            play: function(episode, tvshow) {
                if (!playlist.length) return;

                if (angular.isDefined(episode)) current.episode = episode;
                if (angular.isDefined(tvshow)) current.tvshow = tvshow;
            },
            reset: function() {
                current.tvshow = 0;
                current.episode = 0;
            },
            next: function() {
                if (!playlist.length) return;
                if (playlist[current.tvshow].episodes.length > (current.episode + 1)) {
                    current.episode++;
                } else {
                    current.episode = 0;
                    current.tvshow = (current.tvshow + 1) % playlist.length;
                }
            },
            previous: function() {
                if (!playlist.length) return;
                if (current.episode > 0) {
                    current.episode--;
                } else {
                    current.tvshow= (current.tvshow - 1 + playlist.length) % playlist.length;
                    current.episode = playlist[current.tvshow].tepisode.length - 1;
                }
            }
	    };

	    playlist.add = function(tvshow) { 
            if (playlist.length > 0){
                playlist.splice(0, 1);
            }
	        if (playlist.indexOf(tvshow) != -1) return;
	        playlist.push(tvshow);
	    };

	    playlist.remove = function(tvshow) {
	        var index = playlist.indexOf(tvshow);
	        if (index == current.tvshow) player.reset();
	        playlist.splice(index, 1);
	    };

	    return player;
});


function playEpisode(data, $http){
    var localName = data;

    $http.get('/tv/'+localName+'/play').success(function(data) {

        var fileName                =  localName   
            , outputFile            =   fileName.replace(/ /g, "-")
            , extentionlessFile     =   outputFile.replace(/\.[^/.]+$/, "")
            , videoUrl              =   "/data/tv/"+extentionlessFile+".mp4"
            , subtitleUrl           =   "/data/tv/"+extentionlessFile+".srt"  
            , playerID              =   'player'
            , homeURL               =   '/tv/';

        videoJSHandler(playerID, data, videoUrl, subtitleUrl, localName,homeURL, 5000);

    });
}