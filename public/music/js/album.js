/**
 * Created by jonathan on 01/02/15.
 */
var mcjsCore = angular.module('mcjsCore');


mcjsCore.directive('mcjsAlbum',  function() {
    return { restrict: 'E',
        scope: {
            album: '=item'
        },
        controller : function ($scope, $modal) {
            $scope.open = function (album) {
                $modal.open({
                    templateUrl: 'editModal.html',
                    controller: function ($scope, $modalInstance, current) {
                        $scope.original = angular.copy(current);
                        $scope.current = current;

                        $scope.editItem = function(){
                            current.save()
                            .then(function() {
                                $modalInstance.close();
                            }, function() {
                                $scope.errorMessage = "Error saving " + current.title;
                            });
                        };

                        $modalInstance.result.catch(function() {
                            angular.extend(current, $scope.original);
                        });
                    },
                    size: 'md',
                    windowClass: "flexible",
                    resolve: {
                        current: function () {
                            return album;
                        }
                    }
                });
            };
        },
        templateUrl: '/music/views/album'
    }
});

mcjsCore.directive('mcjsTrack',  function() {
    return { restrict: 'E',
        scope: {
            track: '=item'
        },
        controller : function ($scope, $modal) {

        },
        templateUrl: '/music/views/track'
    }
});


mcjsCore.factory('Album', function ($http) {
    var Album = function(data) {
        angular.extend(this, data);
    };
    Album.prototype.save = function() {
        return $http.post("/music/edit", this);
    };
    Album.all = function () {
        return $http.get('/music/load')
        .then(function(resp) {
            return resp.data.map(function(item) {
                return new Album(item);
            });
        });
    };

    return Album;
});