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
var dashboardApp = angular.module('dashboardApp', ['mcjsCore']);

dashboardApp.directive('dateTime', function($interval, dateFilter) {

    return {
        restrict: 'E',
        link: function (scope, element, attrs) {
            var format,
            timeoutId;

            function updateTime() {
                element.text(dateFilter(new Date(), format));
            }

            attrs.$observe('format', function(value) {
                format = value;
                updateTime();
            });

            element.on('$destroy', function() {
                $interval.cancel(timeoutId);
            });

            timeoutId = $interval(function() {
                updateTime();
            }, 1000);
        }
    };
});

dashboardApp.controller('dashboardCtrl', function($scope, $http) {
    $scope.apps = [];
    $http.get('/apps')
    .then(function(resp) {
        $scope.apps = resp.data;
    });
    $http.get('/checkForUpdate')
    .then(function(resp){
        $scope.newVersion = resp.data.version;
    });

    $scope.doUpdate = function () {
        $scope.updating = true;
        $http.get('/doUpdate')
        .then(function (resp) {
            $scope.updating = false;
            if(resp.data === "restarting") {
                setTimeout(function () {
                    window.location = "/"
                }, 20000);
            }
        });
    };

    $scope.openApp = function(event) {
        event.preventDefault();
        var target = $(event.currentTarget);
        target.parent().addClass('grow');
        setTimeout(function(){
            window.location.href = target.attr('href');
        },200);
    };

});