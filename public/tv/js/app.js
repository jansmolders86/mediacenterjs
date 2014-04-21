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