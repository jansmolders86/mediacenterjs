// Verify that we behave correctly when faced with disjoint buffers.

var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var strtok = require('../lib/strtok');
var sys = require('sys');
var util = require('./util');

var TESTTAB = [
    [1, 1, 1, 1],
    [4],
    [1, 1, 1, 1, 4],
    [2, 2],
    [3, 3, 3, 3],
    [1, 4, 3],
    [5],
    [5, 5, 5]
];

// A net.Stream workalike that emits the indefinitely repeating string
// '\x01\x02\x03\x04' in chunks specified by the 'lens' array param.
var SourceStream = function(lens) {
    EventEmitter.call(this);

    var self = this;

    var len = 0;
    lens.forEach(function(v) {
        len += v;
    });

    self.nvals = Math.floor(len / 4);

    var data = '';
    for (var i = 0; i < self.nvals + 1; i++) {
        data += '\x01\x02\x03\x04';
    }
    var buf = new Buffer(data, 'binary');

    var emitData = function() {
        if (lens.length == 0) {
            self.emit('end');
            return;
        }

        var l = lens.shift();
        var b = buf.slice(0, l);
        buf = buf.slice(l, buf.length);

        self.emit('data', b);

        process.nextTick(emitData);
    };

    process.nextTick(emitData);
};
sys.inherits(SourceStream, EventEmitter);

var run = function() {
    if (TESTTAB.length == 0) {
        return;
    }
    
    var t = TESTTAB.shift();
    var s = new SourceStream(t);

    var stateTab = [
        function(v) {
            assert.strictEqual(v, undefined);
            return strtok.UINT32_BE;
        }
    ];
    for (var i = 0; i < s.nvals - 1; i++) {
        stateTab.push(function(v) {
            assert.equal(v, 16909060);
            return strtok.UINT32_BE;
        });
    }
    stateTab.push(function(v) {
        assert.equal(v, 16909060);

        run();

        return strtok.DONE;
    });

    util.runParseTests(s, stateTab);
};

run();
