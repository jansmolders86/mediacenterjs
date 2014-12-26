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
            function elementIsInRange(el, min, max, vertical) {
                var offset = el.offset();
                if (vertical) {
                    var elright = offset.left + el.width();
                    return (min >= offset.left  && max <= elright) || (min <= offset.left  && max >= elright);
                } else {
                    var elbottom = offset.top + el.height();
                    return (min >= offset.top  && max <= elbottom) || (min <= offset.top  && max >= elbottom);
                }
            }
            function elementIsAboveElement(el1, el2) {
                return el1.offset().top < el2.offset().top;
            }
            function elementIsLeftOfElement(el1, el2) {
                return el1.offset().left < el2.offset().left;
            }
            function sortFn(a, b){
                return a.sort == b.sort ? 0 : +(a.sort > b.sort) || -1;
            }
            function invSortFn(a, b){
                return a.sort == b.sort ? 0 : +(a.sort < b.sort) || -1;
            }
            this.goDirection = function(mapFn, sortFn) {
                var el = items.map(mapFn).sort(sortFn)[0];
                if (el) {
                    self.select(el.value);
                    return true;
                }
                return false;
            };
            this.goLeft = function () {
                var el2 = self.selectedItem();
                if (!el2) {
                    self.select(self.items[0]);
                    return;
                }
                var min = el2.offset().top;
                var max = min + el2.height();
                 if (!self.goDirection(function (el) {
                    if (elementIsInRange(el, min, max, false) && elementIsLeftOfElement(el, el2)) {
                        return {value: el, sort: el.offset().left + el.width()};
                    }
                }, invSortFn)) self.selectOffset(-1);
            };
            this.goRight = function () {
                var el2 = self.selectedItem();
                if (!el2) {
                    self.select(self.items[0]);
                    return;
                }
                var min = el2.offset().top;
                var max = min + el2.height();
                if (!this.goDirection(function (el) {
                    if (elementIsInRange(el, min, max, false) && elementIsLeftOfElement(el2, el)) {
                        return {value: el, sort: el.offset().left};
                    }
                }, sortFn)) self.selectOffset(1);
            };
            this.goDown = function () {
                var el2 = self.selectedItem();
                if (!el2) {
                    self.select(self.items[0]);
                    return;
                }
                var min = el2.offset().left;
                var max = min + el2.width();
                this.goDirection(function (el) {
                    var el2 = self.selectedItem();
                    if (elementIsInRange(el, min, max, true) && elementIsAboveElement(el2, el)) {
                        return {value: el, sort: el.offset().top};
                    }
                }, sortFn);
            };
            this.goUp = function () {
                var el2 = self.selectedItem();
                if (!el2) {
                    self.select(self.items[0]);
                    return;
                }
                var min = el2.offset().left;
                var max = min + el2.width();
                this.goDirection(function (el) {
                    var el2 = self.selectedItem();
                    if (elementIsInRange(el, min, max, true) && elementIsAboveElement(el, el2)) {
                        return {value: el, sort: el.offset().top + el.height()};
                    }
                }, invSortFn);
            };

            angSocket.on('controlling', function(data){
                switch(data.action) {
                    case "goLeft" :
                        self.goLeft();
                        break;
                    case "goRight" :
                        self.goRight();
                        break;
                    case "goUp" :
                        self.goUp();
                        break;
                    case "goDown" :
                        self.goDown();
                        break;
                }
            });
        },
        link: function (scope, element, attrs, controller) {
            document.onkeyup = function (e) {
                switch (e.keyCode) {
                    case 39 :   //next
                        controller.goRight();
                        break;
                    case 37 :   //prev
                        controller.goLeft();
                        break;
                    case 40 : //down
                        controller.goDown();
                        break;
                    case 38 : //up
                        controller.goUp();
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

            element.setSelected = function (newVal) {
                attrs.$set('selected', newVal);
                element.scrollintoview();
            };
            libraryCtrl.addItem(element);

            element[0].onmouseenter = function (e) {
                libraryCtrl.select(element);
            };
            element[0].onmouseleave = function(e) {
                if (libraryCtrl.selectedItem() == element) {
                    libraryCtrl.select(null);
                }
            };
        }
    };
});