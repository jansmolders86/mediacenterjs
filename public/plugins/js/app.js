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

var pluginsApp = angular.module('pluginsApp', ['ui.bootstrap']);

pluginsApp.controller('pluginsCtrl', function ($scope, $http, $modal, $timeout, $window) {

    $http.get('/plugins/loadItems')
    .success(function(data) {
        $scope.plugins = data.plugins;
        $scope.upgrades = $scope.plugins.filter(
            function (plugin) {
                return plugin.isUpgradable;
            });
    });

    $scope.message = null;
    $scope.pluginsChanged = false;

    $scope.install = function (plugin) {
        $scope.message = "Installing " + plugin.name;
        $http.get("/plugins/"+plugin.name+"/install")
        .success(function(data, status, headers, config) {
            $scope.message = data.message;
            $timeout(function () {$scope.message = null;}, 3000);
            if (data.error === 0) {
                $scope.pluginsChanged = true;
                plugin.isInstalled = true;
            }
        });
    }

    $scope.remove = function (plugin) {
        $scope.message = "Uninstalling " + plugin.name;
        $http.get("/plugins/" + plugin.name + "/uninstall")
        .success(function(data, status, headers, config) {
            $scope.message = data.message;
            $timeout(function () {$scope.message = null;}, 3000);
            if (data.error === 0) {
                $scope.pluginsChanged = true;
                plugin.isInstalled = false;
            }
        })
    }

    $scope.upgrade = function (plugin) {
        $scope.message = "Upgrading " + plugin.name;
        $http.get("/plugins/" + plugin.name + "/upgrade")
        .success(function(data, status, headers, config) {
            $scope.message = data.message;
            $timeout(function () {$scope.message = null;}, 3000);
            if (data.error === 0) {
                $scope.pluginsChanged = true;
                plugin.isUpgradable = false;
            }
        })
    }

    $scope.upgradeAll = function () {
        $scope.message = "Upgrading all plugins";
        $scope.upgrades.forEach(function (plugin, idx) {
            $http.get("/plugins/" + plugin.name + "/upgrade")
            .success(function (data, status) {
                if (data.error === 0) {
                    $scope.pluginsChanged = true;
                    plugin.isUpgradable = false;
                }
                if (idx == $scope.upgrades.length - 1) {
                    $scope.message = "Finished Upgrading plugins";
                    $timeout(function () {$scope.message = null;}, 3000);
                }
            });
        });
    }

    $scope.restartServer = function ($event) {
        $event.preventDefault();
        $modal.open({
            template :"<div>Restarting Server<br>Please wait<br><img src='/core/css/img/ajax-loader.gif'/></div>",
            size: 'sm',
            keyboard: false,
            backdrop: "static",
            windowClass: "restart-dialog"
        });
        $http.get("/plugins/reloadServer")
        .success(function () {
            $timeout(function (){
                 $window.location = "/";
            }, 4000);
        });
    }

    $scope.open = function (tvshow) {
        var modalInstance = $modal.open({
            templateUrl: 'editModal.html',
            controller: ModalInstanceCtrl,
            size: 'md',
            resolve: {
                current: function () {
                    return tvshow;
                }
            }
        });
    }
});


