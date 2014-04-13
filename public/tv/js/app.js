'use strict';

/* Controllers */

var tvApp = angular.module('tvApp', []);

tvApp.controller('tvCtrl', function($scope, $http) {
    $http.get('/tv/loadItems').success(function(data) {
        $scope.tvshows = data;
    });
    
    $scope.playEpisode = function(data){
        $scope.playing = true;
        var localName = data;
        
        $http.get('/tv/'+localName+'/play').success(function(data) {
            setTimeout(function(){
                var fileName    =  localName   
                    , outputFile  = fileName.replace(/ /g, "-")
                    , extentionlessFile = outputFile.replace(/\.[^/.]+$/, "")
                    , videoUrl    =  "/data/tv/"+extentionlessFile+".mp4"
                    , setup = {
                        'techOrder' : ['html5', 'flash'],
                        'controls' : true,
                        'preload' : 'auto',
                        'autoplay' : true
                    };
                
                videojs('player', setup, function(){
                    this.src({
                        type : "video/mp4", 
                        src: videoUrl 
                    });
                });
            },5000);
        });
    }
});

