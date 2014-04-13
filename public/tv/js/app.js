'use strict';

var tvApp = angular.module('tvApp', []);

tvApp.controller('tvCtrl', function($scope, $http) {
    $http.get('/tv/loadItems').success(function(data) {
        $scope.tvshows = data;
    });
    
    $scope.playEpisode = function(data){
        $scope.playing = true;
        var localName = data;
        
        $http.get('/tv/'+localName+'/play').success(function(data) {

            var fileName                =  localName   
                , outputFile            = fileName.replace(/ /g, "-")
                , extentionlessFile     = outputFile.replace(/\.[^/.]+$/, "")
                , videoUrl              =  "/data/tv/"+extentionlessFile+".mp4"
                , playerID              = 'player'
                , homeURL               = '/tv/';
            
            videoJSHandler(playerID, data, videoUrl, localName,homeURL, 5000);

        });
    }
});