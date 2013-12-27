youtubeApp.directive('search', ['SearchYoutube', '$location', function (SearchYoutube, $location) {
	return {
		restrict: 'A',
		link: function($scope, element) {
			element.keyup(function(event){
		    	if(element.val().length > 0 && event.keyCode === 13){
		    		// Show the Searching... label
		    		element.siblings('label').fadeIn('fast', function () {
		    			element.siblings('label').text('Searching');
		    			var timeout = setInterval(function (){
		    				var searchText = element.siblings('label').text();
		    				element.siblings('label').text(searchText + '.');
		    				if(searchText.indexOf('..') !== -1) {
		    					clearTimeout(timeout);
		    				}
		    			}, 1000);
		    		});
		    		SearchYoutube.search(element.val()).success(function (data) {
		    			$location.path('/search/' + element.val());
		    			// Use search results to repopulate the cards
	    				$scope.videos = data.videos;
	    				//$scope.youtube.searchResults = data;
		    			element.siblings('label').fadeOut('fast');
		    		}).error(function (error) {
		    			element.siblings('label').text(error.message);
		    		});
		    	}
		    });
		}
	}
}]);
youtubeApp.directive('videos', function () {
	return {
		restrict: 'A',
		link: function($scope, element, attrs) {
			$scope.$watch('videos', function (videoData) {
				if(videoData) {
					element.parent().children('.card:nth-child(even)').addClass('animated rotateInUpLeft');
					element.parent().children('.card:nth-child(odd)').addClass('animated rotateInUpRight');
				}
			});
		}
	}
});
youtubeApp.directive('tokenerror', ['UpdateToken', function (UpdateToken) {
	return {
		restrict: 'A',
		link: function($scope, element) {
			$scope.$watch('tokenerror', function () {
				var countdown = 3;
				var interval = setInterval(function () {
					if(countdown === 0) {
						clearInterval(interval);
						OAuth.initialize(localStorage.getItem('oauth_key'));
						OAuth.popup('youtube', function (error, oauthData){
							if(error) {
								$scope.error = error;
							} else {
								localStorage.setItem('oauth_token', oauthData.access_token);
								UpdateToken.update(oauthData.access_token).success(function (data) {
									delete $scope.tokenerror;
									$scope.error = 'Refreshing...';
									setTimeout(function () {
										location.reload();
									},2000);
								}).error(function (error) {
									$scope.error = error;
								});
							}
						});
					}
					element.children('span').text(countdown--);
				}, 1000);
			});
		}
	}
}]);
youtubeApp.directive('videoAngular', ["$timeout",
    function($timeout) {
        var myPlayer;
        return {
            restrict: 'E',
            templateUrl: 'views/video.html',
            link: function($scope, element) {
                // TODO Need to fix as this causes the stack to exceed its limit
                if (myPlayer) {
                    myPlayer.dispose();
                }
                $scope.width = element.parent().parent().parent().width();
                $scope.height = element.parent().parent().parent().height();
                $scope.tryWait = 0;
                $scope.tryWaitYoutubeApi = function() {
                    $timeout(function() {
                        if ($scope.video) {

                            myPlayer = videojs('currentVideo', {
                                "techOrder": ["youtube"],
                                "src": "http://www.youtube.com/watch?v=" + $scope.video.videoID
                            });
                        } else {
                            if ($scope.tryWait >= 5) {
                                console.log("Failed connect to youtube");
                            } else {
                                $scope.tryWait++;
                                console.log("Trying wait youtube api...");
                                $scope.tryWaitYoutubeApi();
                            }


                        }

                    }, 500);
                };
                $scope.tryWaitYoutubeApi();
            }
        }
    }
])
