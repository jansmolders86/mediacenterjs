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

angular.module('musicPlayerApp')
    .filter('startFrom', function() {
        return function(input, start) {
            start = +start; //parse to int
            return input.slice(start);
        };
    })

    .controller('MainCtrl', function ($scope, $http, $rootScope) {
        $scope.currentTrack = 0;
        $scope.pageSize = 5;
        $scope.data=[];

        var updateTrack = function(){
            console.log('sda');
            $rootScope.$broadcast('audio.set', 'mp3/' + $scope.data[$scope.currentTrack].file,
            $scope.data[$scope.currentTrack], $scope.currentTrack, $scope.data.length);
        };

        $rootScope.$on('audio.next', function(){
            $scope.currentTrack++;
            if ($scope.currentTrack < $scope.data.length){
                updateTrack();
            }else{
                $scope.currentTrack=$scope.data.length-1;
            }
        });

        $rootScope.$on('audio.prev', function(){
            $scope.currentTrack--;
            if ($scope.currentTrack >= 0){
                updateTrack();
            }else{
                $scope.currentTrack = 0;
            }
        });

        $http.get('/music/loadItems').success(function(response){
            $scope.data = response;
            updateTrack();
        });
    });