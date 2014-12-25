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
})
.directive('mcjsLibrary', function() {
    return {
        restrict: 'A',
        scope: {},
        controller: function($scope, $element, angSocket) {
            var items = this.items = [];
            var self = this;
            this.selectedIndex = -1;

            this.getColumns = function () {
                var itemWidth = $element[0].querySelector("[mcjs-library-item]").clientWidth;
                return Math.round($element.width() / itemWidth);
            };

            this.select = function (item) {
                if (items[self.selectedIndex]) {
                    items[self.selectedIndex].setSelected(false);
                }
                if (!item) {
                    self.selectedIndex = -1;
                    return;
                }
                item.setSelected(true);
                self.selectedIndex = items.indexOf(item);
            };
            this.selectOffset = function (indexOffset) {
                var newIndex = self.selectedIndex + indexOffset;
                var item = self.items[newIndex];
                if (item) {
                    self.select(item);
                }
            };
            this.selectedItem = function () {
                return items[self.selectedIndex];
            };
            this.addItem = function (item) {
                items.push(item);
            };
            angSocket.on('controlling', function(data){
                switch(data.action) {
                    case "goLeft" :
                        self.selectOffset(-1);
                        break;
                    case "goRight" :
                        self.selectOffset(1);
                        break;
                    case "goUp" :
                        self.selectOffset(self.getColumns());
                        break;
                    case "goDown" :
                        self.selectOffset(self.getColumns());
                        break;
                }
            });
        },
        link: function (scope, element, attrs, controller) {
            document.onkeyup = function (e) {
                switch (e.keyCode) {
                    case 39 :   //next
                        controller.selectOffset(1);
                        break;
                    case 37 :   //prev
                        controller.selectOffset(-1);
                        break;
                    case 40 : //down
                        controller.selectOffset(controller.getColumns());
                        break;
                    case 38 : //up
                        controller.selectOffset(-controller.getColumns());
                        break;
                }
            };
        }
    };
})
.directive('mcjsLibraryItem', function () {
    return {
        require: '^mcjsLibrary',
        restrict: 'A',
        link: function (scope, element, attrs, libraryCtrl) {

            scope.setSelected = function (newVal) {
                attrs.$set('selected', newVal);
                element.scrollintoview();
            };
            libraryCtrl.addItem(scope);

            element[0].onmouseenter = function (e) {
                libraryCtrl.select(scope);
            };
            element[0].onmouseleave = function(e) {
                if (libraryCtrl.selectedItem() == scope) {
                    libraryCtrl.select(null);
                }
            };
        }
    };
});