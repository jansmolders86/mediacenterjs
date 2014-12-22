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


movieApp.service('mcjsMediaPlayer', function () {
    return {
        playing : false,
        videoJSHandler :  videoJSHandler
    };
});

movieApp.factory('Movie', function($http, mcjsMediaPlayer) {
    var Movie = function(data) {
        angular.extend(this, data);
    };
    Movie.prototype.save = function() {
        return $http.post("/movies/edit", this);
    };
    Movie.prototype.update = function() {
        var self = this;
        var promise = $http.post("/movies/update", this);
        promise.then(function (resp) {
            angular.extend(self, resp.data);
        });
        return promise;
    };
    Movie.prototype.play = function () {
        var platform = 'desktop';
        if (navigator.userAgent.match(/Android/i)) {
            platform = 'android';
        } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
            platform = 'ios';
        }
        var movie = this;
        mcjsMediaPlayer.playing = true;
        $http.get('/movies/'+this.id+'/play/'+platform)
        .success(function(data) {

            //Get url+port
            var url = window.location.href;
            var arr = url.split("/");
            var result = arr[0] + "//" + arr[2];

            var fileName                =   movie.originalName
                , outputFile            =   fileName.replace(/ /g, "-")
                , extentionlessFile     =   outputFile.replace(/\.[^\.]+$/, "")
                , videoUrl              =   result+data.outputPath
                , subtitleUrl           =   "/data/movies/"+extentionlessFile+".srt"
                , playerID              =   'player'
                , homeURL               =   '/movies/'
                , type                  =   'movies';
            mcjsMediaPlayer.videoJSHandler(playerID, data, movie.id, videoUrl, subtitleUrl, movie.originalName,homeURL, 5000, type);
        })
        .error(function () {
            mcjsMediaPlayer.playing = false;
            sweetAlert({title : "",
                text : "The movie " +  movie.title + " could not be found",
                type : "error",
                allowOutsideClick : true});
        });
    };
    Movie.all = function() {
        return $http.get('/movies/load')
        .then(function(resp) {
            return resp.data.map(function(item) {
                return new Movie(item);
            });
        });
    };
    return Movie;
});

movieApp.directive('mcjsMovie', function() {
	return { restrict: 'E',
    scope: {
    	movie: '='
    },
    controller : function ($scope, $modal) {
		$scope.open = function (movie) {
	        $modal.open({
	            templateUrl: 'editModal.html',
	            controller: 'ModalInstanceCtrl',
	            size: 'md',
	            windowClass: "flexible",
	            resolve: {
	                current: function () {
	                    return movie;
	                }
	            }
	        });
	    }
    },
    templateUrl: 'views/movie'
}
});

movieApp.controller('ModalInstanceCtrl', function ($scope, $modalInstance, current) {
    $scope.original = angular.copy(current);
    $scope.current = current;

    $scope.editItem = function(){
        current.save()
        .then(function() {
            $modalInstance.close();
        }, function() {
            $scope.errorMessage = "Couldn't find metadata for movie called " + current.title + " on TMDB";
        });
    };

    $modalInstance.result.catch(function() {
        angular.extend(current, $scope.original);
    });

    $scope.updateItem = function(){
        current.update()
        .then(function() {
            $modalInstance.close();
        }, function () {
            $scope.errorMessage = "Couldn't find metadata for movie called " + current.title + " on TMDB";
        });
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
    $scope.keyevents    = keyevents(angSocket, $scope);


    angSocket.on('progress', function (data) {
        $scope.serverMessage = data.msg;
    });

    angSocket.on('serverStatus', function (data) {
        $scope.serverStatus = data.msg;
    });
});
