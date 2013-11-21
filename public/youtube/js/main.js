var youtubeApp = angular.module('youtubeApp', ['ngRoute']);
youtubeApp.config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
	$routeProvider.when('/', {
      templateUrl: 'views/cards.html',
      controller: 'MainCtrl'
    }).when('/search/:query', {
      templateUrl: 'views/cards.html',
      controller: 'SearchCtrl'
    }).when('/video/:id', {
      templateUrl: 'views/videoContainer.html',
      controller: 'VideoCtrl'
    }).otherwise({
      redirectTo: '/'
    });
}]);