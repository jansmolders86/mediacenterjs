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

    var musicApp = angular.module('musicApp', ['ui.bootstrap', 'mcjsCore']);


    musicApp.directive('mcjsAlbum',  function() {
        return { restrict: 'E',
            scope: {
                album: '=item'
            },
            controller : function ($scope, $modal) {
                $scope.open = function (album) {
                    $modal.open({
                        templateUrl: 'editModal.html',
                        controller: function ($scope, $modalInstance, current) {
                            $scope.original = angular.copy(current);
                            $scope.current = current;

                            $scope.editItem = function(){
                                current.save()
                                .then(function() {
                                    $modalInstance.close();
                                }, function() {
                                    $scope.errorMessage = "Error saving " + current.title;
                                });
                            };

                            $modalInstance.result.catch(function() {
                                angular.extend(current, $scope.original);
                            });
                        },
                        size: 'md',
                        windowClass: "flexible",
                        resolve: {
                            current: function () {
                                return album;
                            }
                        }
                    });
                };
            },
            templateUrl: 'views/album'
        }
    });

    musicApp.directive('mcjsTrack',  function() {
        return { restrict: 'E',
            scope: {
                track: '=item'
            },
            controller : function ($scope, $modal) {

            },
            templateUrl: 'views/track'
        }
    });


    musicApp.factory('Album', function ($http) {
        var Album = function(data) {
            angular.extend(this, data);
        };
        Album.prototype.save = function() {
            return $http.post("/music/edit", this);
        };
        Album.all = function () {
            return $http.get('/music/load')
            .then(function(resp) {
                return resp.data.map(function(item) {
                    return new Album(item);
                });
            });
        };

        return Album;
    });

    function createDropDirective(ngevent, jsevent) {
        musicApp.directive(ngevent, function ($parse) {
            return function ($scope, element, attrs) {
                var expressionHandler = $parse(attrs[ngevent]);
                element.on(jsevent, function(ev) {
                    $scope.$apply(function() {
                        expressionHandler($scope, {$event:ev});
                    });
                });
        }
        });
    }
    createDropDirective('ngOnDragBegin', 'dragstart');
    createDropDirective('ngOnDrop', 'drop');
    createDropDirective('ngOnDragOver', 'dragover');

    window.musicCtrl = function($scope, $http, player, $modal, $filter, audio, Album) {
        $scope.player = player;
        $scope.serverMessage = 0;
        $scope.serverStatus= '';
        $scope.className = "normal";


        Album.all()
        .then(function (albums) {
            $scope.albums = albums;
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
            single = false,
            random = false,
            currentTrack = null,
            currentAlbum = null,
            current = {
                itemIdx: -1,
                subItemIdx: -1
            };

        player = {
            playlist: playlist,
            current: current,
            currentTrack: currentTrack,
            currentAlbum: currentAlbum,
            single: false,
            playing: false,
            play: function(subItemIdx, itemIdx) {
                if (angular.isDefined(itemIdx)) {
                   current.itemIdx = itemIdx;
                }
                if (angular.isDefined(subItemIdx)) {
                    current.subItemIdx = subItemIdx;
                }

                if (itemIdx !== null) {
                    var currentItem = playlist[current.itemIdx];
                    player.currentTrack = currentItem.tracks[current.subItemIdx];
                    player.currentAlbum = currentItem;
                } else {
                    player.currentTrack = subItemIdx;
                    player.single = true;
                }

                audio.src = 'music/'+player.currentTrack.id +'/play/';
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
                current.itemIdx = -1;
                current.subItemIdx = -1;
            },
            shuffle: function(){
                if(player.random === true){
                    player.random = false;
                } else {
                    player.random = true;
                }
                randomTrack(player, playlist,current);
            },
            seek: function($event) {
                // var clientX = $event.clientX
                //    , left = clientX - $($event.target).parent().offset().left
                //    , perc = (left / $($event.target).parent().width())
                //    , time = perc * $scope.len;

                //    audio.currentTime = parseInt(time);
            },
            next: function() {
                if (!playlist.length){
                    return;
                }
                paused = false;

                if(player.random === true){
                    randomTrack(player, playlist,current);
                } else {

                    var currentItem = playlist[current.itemIdx];
                    if (currentItem._type ==='track') {
                        current.itemIdx++;
                    } else if (currentItem._type === 'album') {
                        if (current.subItemIdx + 1 >= currentItem.tracks.length) {
                            current.itemIdx++;
                            current.subItemIdx = 0;
                        } else {
                            current.subItemIdx++;
                        }
                    }

                    if (player.playing){
                        player.play();
                    }

                }
            },
            previous: function() {
                if (!playlist.length){
                    return;
                }
                paused = false;

                if(player.random === true){
                    randomTrack(player, playlist,current);
                } else {
                    var currentItem = playlist[current.itemIdx];
                    if (current.subItemIdx > 0) {
                        current.subItemIdx--;
                    } else {
                        current.itemIdx--;
                        var newItem = playlist[current.itemIdx];
                        if (newItem._type === 'track') {
                            current.subItemIdx = 0;
                        } else if (newItem._type === 'album') {
                            current.subItemIdx = newItem.tracks.length - 1;
                        }
                    }
                    if (player.playing){
                        player.play();
                    }
                }
            }
        };

        playlist.add = function(album) {

            if (album._type === 'album') {
                if (playlist.length > 0){
                    playlist.splice(0, 1);
                }
            }
            if (playlist.indexOf(album) != -1){
                return;
            }
            playlist.push(album);
        };

        playlist.remove = function(album) {
            var index = playlist.indexOf(album);
            if (index == current.itemIdx){
                player.reset();
            }
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

    function randomTrack(player, playlist,current){
        var currentItem = playlist[current.itemIdx];
        if(player.random === true){
            var currentAlbumTracks  = currentItem.tracks.length;
            var randomIndex = Math.floor(Math.random() * currentAlbumTracks);
            current.subItemIdx = randomIndex;
            if (player.playing){
                player.play();
            }
        }
    }

})(window);

