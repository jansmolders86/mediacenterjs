'use strict';

angular.module('musicPlayerApp', [
    'ngRoute',
    'audioPlayerDirective'
]).config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'music/views/main.html',
            controller: 'MainCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
});