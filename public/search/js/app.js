/**
 * Created by jonathan on 18/01/15.
 */

var searchApp = angular.module('searchApp', ['ui.bootstrap', 'mcjsCore']);
searchApp.controller('searchCtrl', function($scope, $http) {

    $scope.search = function (query) {
        $scope.results = {};
        if (query.$ == "") {
            return;
        }
        $scope.apps.filter(function(app) {
            return app.search;
        })
        .forEach(function(app) {
            $http.get(app.search.url + "?q=" + query.$)
            .then(function(results) {
               $scope.results[app.appName] = {app:app, results : results.data};
            });
        });
    };

    $http.get("/apps")
    .then(function (result) {
        $scope.apps = result.data;
    });
})
.directive('searchItem', function($compile) {
    return { restrict: 'E',
        scope: {
            item: '=',
            view: '='
        },
        link : function (scope, element) {
            var el = $compile("<"+scope.view+" item=\"item\"></"+scope.view+">")(scope);

            element.append(el);
        }
    }
});