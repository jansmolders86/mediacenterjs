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