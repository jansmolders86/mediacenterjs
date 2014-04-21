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

movieApp.controller('movieCtrl', function($scope, $http,$document,$window) {
    $http.get('/movies/loadItems').success(function(data) {
        $scope.movies = data;
    });
    
    $scope.orderProp = 'genre';
                                     
    $scope.playMovie = function(data){
        $scope.playing = true;
        var localName = data;
        
        $http.get('/movies/'+localName+'/play').success(function(data) {

            var fileName                =  localName   
                , outputFile            =   fileName.replace(/ /g, "-")
                , extentionlessFile     =   outputFile.replace(/\.[^/.]+$/, "")
                , videoUrl              =   "/data/movies/"+extentionlessFile+".mp4"
                , subtitleUrl           =   "/data/movies/"+extentionlessFile+".srt"  
                , playerID              =   'player'
                , homeURL               =   '/movies/';
            
            videoJSHandler(playerID, data, videoUrl, subtitleUrl, localName,homeURL, 5000);

        });
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