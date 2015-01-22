/**
 * Created by jonathan on 22/01/15.
 */
var mcjsCore = angular.module('mcjsCore');

mcjsCore.factory('Movie', function($http, mcjsMediaPlayer) {
    var Movie = function(data) {
        angular.extend(this, data);
    };
    Movie.prototype.save = function() {
        return $http.post("/movies/edit", this);
    };
    Movie.prototype.update = function() {
        var self = this;
        var promise = $http.post("/movies/update", this);
        promise.then(function (resp) {
            angular.extend(self, resp.data);
        });
        return promise;
    };
    Movie.prototype.play = function () {
        var platform = 'desktop';
        if (navigator.userAgent.match(/Android/i)) {
            platform = 'android';
        } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
            platform = 'ios';
        }
        var movie = this;
        mcjsMediaPlayer.playing = true;
        $http.get('/movies/'+this.id+'/play/'+platform)
        .success(function(data) {
            //Get url+port
            var url = window.location.href;
            var arr = url.split("/");
            var result = arr[0] + "//" + arr[2];

            var fileName                =   data.fileName
            , outputFile            =   fileName.replace(/ /g, "-")
            , extentionlessFile     =   outputFile.replace(/\.[^\.]+$/, "")
            , videoUrl              =   result + data.outputPath
            , subtitleUrl           =   "/data/movies/"+extentionlessFile+".srt"
            , playerID              =   'player'
            , homeURL               =   '/movies/'
            , type                  =   'movies';

            mcjsMediaPlayer.videoJSHandler(playerID, data, movie.id, videoUrl, subtitleUrl, fileName, homeURL, 5000, type);
        })
        .error(function () {
            mcjsMediaPlayer.playing = false;
            sweetAlert({title : "",
                text : "The movie " +  movie.title + " could not be found",
                type : "error",
                allowOutsideClick : true});
        });
    };
    Movie.all = function() {
        return $http.get('/movies/load')
        .then(function(resp) {
            return resp.data.map(function(item) {
                return new Movie(item);
            });
        });
    };
    return Movie;
});

mcjsCore.directive('mcjsMovie', function() {
    return { restrict: 'E',
        scope: {
            movie: '=item'
        },
        controller : function ($scope, $modal) {
            $scope.open = function (movie) {
                var controller = function ($scope, $modalInstance, current) {
                    $scope.original = angular.copy(current);
                    $scope.current = current;

                    $scope.editItem = function(){
                        current.save()
                        .then(function() {
                            $modalInstance.close();
                        }, function() {
                            $scope.errorMessage = "Couldn't find metadata for movie called " + current.title + " on TMDB";
                        });
                    };

                    $modalInstance.result.catch(function() {
                        angular.extend(current, $scope.original);
                    });

                    $scope.updateItem = function(){
                        current.update()
                        .then(function() {
                            $modalInstance.close();
                        }, function () {
                            $scope.errorMessage = "Couldn't find metadata for movie called " + current.title + " on TMDB";
                        });
                    };
                };

                $modal.open({
                    templateUrl: '/movies/views/editModal',
                    controller: controller,
                    size: 'md',
                    windowClass: "flexible",
                    resolve: {
                        current: function () {
                            return movie;
                        }
                    }
                });
            }
        },
        templateUrl: '/movies/views/movie'
    }
});