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

var photosApp = angular.module('photosApp', ['ui.bootstrap']);

photosApp.controller('photosCtrl', function($scope, $http, $modal) {
    $scope.photos = [];
    $scope.isInAlbum = false;
    $scope.lastPaths = [];
    $scope.lastAlbum = [];
    $scope.imageToView = undefined;

    $http.get('/photos/loadItems').success(function(data) {
        $scope.photos = data;
    });

    $scope.back = function () {
        var path = '/photos/loadItems/';
        if ($scope.lastPaths.length > 1) {
            $scope.lastPaths.pop();
            $scope.lastAlbum.pop();
            path += '?path=' + $scope.lastPaths[$scope.lastPaths.length - 1];
        } else {
            $scope.lastPaths = [];
            $scope.lastAlbum = [];
        }

        $http.get(path).success(function(data) {
            $scope.photos = data;
            $scope.isInAlbum = $scope.lastPaths.length > 0;
        });
    };

    $scope.getLastAlbum = function () {
        if ($scope.lastAlbum.length >= 1) {
            return 'to ' + $scope.lastAlbum[$scope.lastAlbum.length - 1];
        }

        return '';
    };

    $scope.closeImageView = function () {
        $scope.imageToView = undefined;
        jQuery(document).unbind('keypress');
    };

    $scope.galleryNavigationPress = function (e) {
        if (e.which === 39) {
            var viewingImage = $scope.photos.indexOf($scope.imageToView);
            if (viewingImage + 1 < $scope.photos.length) {
                $scope.imageToView = $scope.photos[viewingImage + 1];
            }
        } else if (e.which === 37) {
            var viewingImage = $scope.photos.indexOf($scope.imageToView);
            if (viewingImage > 0) {
                $scope.imageToView = $scope.photos[viewingImage - 1];
            }
        }
    };

    $scope.itemClick = function (item) {
        if (item.isAlbum) {
            $http.get('/photos/loadItems/?path=' + item.filepath).success(function(data) {
                $scope.photos = data;
                $scope.lastPaths.push(item.filepath);
                if ($scope.isInAlbum) {
                    $scope.lastAlbum.push(item.filename);
                }
                $scope.isInAlbum = true;
            });
        } else {
            $scope.imageToView = item;
        }
    };
});
