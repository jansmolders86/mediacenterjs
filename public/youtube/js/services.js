youtubeApp.service('SearchYoutube', ['$http', function ($http) {
	return {
		search: function(query) {
			return $http.post('/youtube/searchYoutube', {'q': query});
		}
	}
}]);
youtubeApp.service('UpdateToken', ['$http', function ($http) {
	return {
		update: function(token) {
			return $http.post('/youtube/updateToken', {'oauth': token});
		}
	}
}]);
youtubeApp.service('Index', ['$http', function ($http) {
	return $http.get('/youtube/index');
}]);
youtubeApp.service('OauthAng', ['$http', function ($http) {
	return {
		getKey: function() {
			return $http.get('/youtube/getKey');
		}
	}
}]);
youtubeApp.service('Videos', ['$http', function ($http) {
	return {
		getVideo: function(query) {
			return $http.get('/youtube/getVideo', {params: {id: query}});
		}
	}
}]);