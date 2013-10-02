// Test deferral of next-known type.

var assert = require('assert');
var util = require('./util');
var strtok = require('../lib/strtok');

var f = function(v, cb) {
    assert.equal(v, 0x1a);

    process.nextTick(function() {
        cb(strtok.UINT8)
    });

    return strtok.DEFER;
};

util.runParseTests('\x1a\x1a\x1a\x1a\x1a\x1a', [
    function(v) {
        assert.ok(v === undefined);
        return strtok.UINT8;
    },
    f, f, f, f, f, f
]);
