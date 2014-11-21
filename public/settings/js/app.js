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

var settingsApp = angular.module('settingsApp', ['ui.bootstrap']);

settingsApp.controller('settingsCtrl', function ($scope, $http, $modal, $timeout, $window) {
    $scope.isoLangs = isoLangs;
    if(localStorage.getItem('oauth_token')) {
        $scope.oauthToken = localStorage.getItem('oauth_token');
        $scope.oauthKey = localStorage.getItem('oauth_key');
    }
    $http.get('/settings/load').success(function(data) {
        $scope.availableLanguages = data.availableLanguages;
        $scope.availableQuality = data.availableQuality;
        $scope.availableScreensavers = data.availableScreensavers;
        $scope.tvFormatTypes = data.tvFormatTypes;
        $scope.themes = data.themes;
        $scope.config = data.config;
        $scope.pluginSettings = data.pluginSettings;
        $scope.countries = data.countries;
    });
    $http.get('/settings/devices').success(function (data) {
        $scope.devices = data;
    });
    //Can't have a custom function name in $http.jsonp
    $.ajax({
     type: "GET",
     dataType: "jsonp",
     jsonpCallback : 'parseResponse',
     url: "http://www.mediacenterjs.com/global/js/getkey.js",
     success: function (data) {
         $scope.oauthKey = data.key;
     },
     error: function (jqXHR, textStatus, errorThrown) {
         console.log('error', errorThrown);
         // fallback to last known working key
         $scope.oauthKey = 'HVpbR2kQokDRgU3z5kJhLbS7BjY';
     }
    });
    $scope.setLocked =function (device, locked) {
        $http({
            method: "post",
            data:'{"'+device.deviceID+'":""}',
            url: locked ? '/lockClient' : '/unlockClient'
        })
        .success(function (data, status, headers, config) {
            if(data === 'done') {
                setTimeout(function(){
                    location.reload();
                },2000);
            }
        });
    };
    $scope.oauth = function(e) {
        e.preventDefault();
        OAuth.initialize($scope.oauthKey);
        OAuth.popup('youtube', function (error, oauthData){
            if(error instanceof Error) {
                $('label[for="oauthKey"]').text(error.message);
            } else {
                localStorage.setItem('oauth_token', oauthData.access_token);
                localStorage.setItem('oauth_key', $scope.oauthKey);
                $scope.oauthToken = localStorage.getItem('oauth_token');
                $scope.oauthKey = localStorage.getItem('oauth_key');
            }
        });
    };
    $scope.clearCache = function(caches) {
        $modal.open({
            templateUrl: "clearCacheModal.html",
            size: 'sm',
        }).result.then(function(response) {
            $http.post('/clearCache', {cache : caches})
            .success(function(data, status, headers, config) {
                if (data === 'done') {
                    $scope.message = "Successfully Executed";
                }
            })
            .error(function(data, status, headers, config) {
                $scope.message = "Error clearing cache";
            });
        });
    };
    $scope.getScraperData = function (scraperLink) {
        $modal.open({
            templateUrl: "clearCacheModal.html",
            size: 'sm',
        }).result.then(function(response) {
            $http.post('/getScraperData', {scraperlink : scraperLink})
            .success(function(data, status, headers, config) {
                alert(data);
                if (data === 'done') {
                    $scope.message = "Successfully Executed";
                }
            })
            .error(function(data, status, headers, config) {
                $scope.message = "Error getting data";
            });
        });
    }
});

settingsApp.directive('setting', function(){
    return {
        restrict : 'E',
        transclude : true,
        template: '<div class="form-group mcjs-rc-controllable"> \
                        <label class="col-md-2"></label> \
                        <div class="col-md-10 input-group"> \
                            <span  class="input-group-addon"> \
                                <i class="icon"></i> \
                            </span> \
                            <input class="form-control mcjs-rc-clickable"></input> \
                        </div> \
                    </div>',
        compile: function(elem, attrs, transcludeFn) {
            elem.find("i.icon").addClass(attrs.icon);
            return function (scope, element, attrs) {
                transcludeFn(scope, function(clone) {
                    function replaceSub(sel, sel2) {
                        var tEl = elem.find(sel);
                        var classes = tEl.attr("class");
                        var newEl = clone.filter(sel2 || sel);
                        tEl.replaceWith(newEl);
                        newEl.addClass(classes);
                    }
                    replaceSub("label");
                    replaceSub("input, select");
                    //TODO: Add more elements like checkbox, radio button etc.
                });
            }
        }
    }
});


settingsApp.directive('createControl', function($timeout){
    return function(scope, element, attrs){
        attrs.$observe('createControl',function(){

            var elementData         = attrs.createControl.split(',')
            , elementType           = elementData[0].toString()
            , elementName           = elementData[1].toString()
            , elementPlaceholder    = elementData[2].toString()
            , elementModel          = ''
            , configEntry           = scope.config[elementName];

            if( configEntry !== null && configEntry !== undefined){
                elementModel = configEntry;
            }

            //TODO: Add more elements like checkbox, radio button, selectbox etc.
            element.html('<input class="form-control mcjs-rc-clickable" name="'+elementName+'" value="'+elementModel+'" type="'+elementType+'" placeholder="'+elementPlaceholder+'" id="'+elementName+'" />');
        });
    }
});
