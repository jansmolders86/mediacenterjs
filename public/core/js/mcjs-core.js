angular.module('mcjsCore', [])
.directive('mcjsProgress', function() {
  return {
    restrict: 'E',
    scope: {
    	percent: '='
    },
    template: '<div class="progress-pie-chart" data-percent="percent" ng-class="{gt50: percent > 50}" ng-show="percent > 0"> \
                <div class="ppc-progress"> \
                    <div class="ppc-progress-fill" style="-webkit-transform:rotate({{360*percent/100}}deg); transform:rotate({{360*percent/100}}deg);"></div> \
                </div> \
                <div class="ppc-percents"> \
                    <div class="pcc-percents-wrapper"> \
                        <span> {{percent}}%</span> \
                    </div> \
                </div> \
            </div>'
  };
})
.factory('angSocket', function($rootScope) {
    var socket = io.connect();
    socket.on('connect', function () {
        socket.emit('screen');
    });
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });

        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});