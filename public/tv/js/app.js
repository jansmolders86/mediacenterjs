'use strict';

var tvApp = angular.module('tvApp', []);

tvApp.controller('tvCtrl', function($scope, $http) {
    $http.get('/tv/loadItems').success(function(data) {
        $scope.tvshows = data;
    });
    
    $scope.orderProp = 'genre';
          
                                     
    $scope.playEpisode = function(data){
        $scope.playing = true;
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
});