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
            this.selectedIndex = -1;

            this.select = function (item) {
                if (items[this.selectedIndex]) {
                    items[this.selectedIndex].setSelected(false);
                }
                if (!item) {
                    this.selectedIndex = -1;
                    return;
                }
                item.setSelected(true);
                this.selectedRect = item[0].getBoundingClientRect();
                this.selectedIndex = items.indexOf(item);
            };
            this.selectOffset = function (indexOffset) {
                var newIndex = this.selectedIndex + indexOffset;
                var item = this.items[newIndex];
                if (item) {
                    this.select(item);
                }
            };
            this.selectedItem = function () {
                return items[this.selectedIndex];
            };
            this.addItem = function (item) {
                items.push(item);
            };
            var self = this;
            function elementIsInRange(el, vertical) {
                var rect = self.selectedRect;
                var offset = el.offset();
                var min, max;
                if (vertical) {
                    min = rect.left;
                    max = rect.right;
                    var elright = offset.left + el.width();
                    if ((min >= offset.left  && max <= elright) || (min <= offset.left  && max >= elright)) {
                        return 3;
                    }
                    return (offset.left >= min && offset.left <= max) + (elright >= min && elright <= max);
                } else {
                    min = rect.top;
                    max = rect.bottom;
                    var elbottom = offset.top + el.height();
                    if ((min >= offset.top  && max <= elbottom) || (min <= offset.top  && max >= elbottom)) {
                        return 3;
                    }
                    return (offset.top >=  min && offset.top <= max) + (elbottom >= min && elbottom <= max);
                }
            }
            function elementIsAboveSelected(el) {
                return el.offset().top < self.selectedRect.top;
            }
            function elementIsBelowSelected(el) {
                return self.selectedRect.top < el.offset().top;
            }
            function elementIsLeftOfSelected(el) {
                return el.offset().left < self.selectedRect.left;
            }
            function elementIsRightOfSelected(el) {
                return self.selectedRect.left < el.offset().left;
            }
            function sortFn(a, b) {
                var m = b.sort[0] - a.sort[0];
                if (m != 0) {
                    return m;
                }
                return b.sort[1] - a.sort[1];
            }
            function invSortFn(a, b) {
                var m = b.sort[0] - a.sort[0];
                if (m != 0) {
                    return m;
                }
                return a.sort[1] - b.sort[1];
            }
            this.goDirection = function(mapFn, sortFn) {
                var el2 = this.selectedItem();
                if (!el2) {
                    this.select(this.items[0]);
                    return;
                }
                var el = items.map(mapFn).sort(sortFn)[0];
                if (el) {
                    this.select(el.value);
                    return true;
                }
                return false;
            };
            this.goLeft = function () {
                 if (!this.goDirection(function (el) {
                     if (elementIsLeftOfSelected(el)) {
                         var match = elementIsInRange(el, false);
                         if (match > 0) {
                             return {value: el, sort: [match, el.offset().left + el.width()]};
                         }
                     }
                }, sortFn)) this.selectOffset(-1);
            };
            this.goRight = function () {
                if (!this.goDirection(function (el) {
                    if (elementIsRightOfSelected(el)) {
                        var match = elementIsInRange(el, false);
                        if (match > 0) {
                            return {value: el, sort: [match, el.offset().left]};
                        }
                    }
                }, invSortFn)) this.selectOffset(1);
            };
            this.goDown = function () {
                this.goDirection(function (el) {
                    if (elementIsBelowSelected(el)) {
                        var match = elementIsInRange(el, true);
                        if (match > 0) {
                            return {value: el, sort: [match, el.offset().top]};
                        }
                    }
                }, invSortFn);
            };
            this.goUp = function () {
                this.goDirection(function (el) {
                    if (elementIsAboveSelected(el)) {
                        var match = elementIsInRange(el, true);
                        if (match > 0) {
                            return {value: el, sort: [match, el.offset().top + el.height()]};
                        }
                    }
                }, sortFn);
            };

            angSocket.on('controlling', function(data){
                switch(data.action) {
                    case "goLeft" :
                        this.goLeft();
                        break;
                    case "goRight" :
                        this.goRight();
                        break;
                    case "goUp" :
                        this.goUp();
                        break;
                    case "goDown" :
                        this.goDown();
                        break;
                }
            });
        },
        link: function (scope, element, attrs, controller) {
            document.onkeyup = function (e) {
                console.time("goDir");
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
                console.timeEnd("goDir");
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
                if (newVal) {
                    element.scrollintoview();
                }
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