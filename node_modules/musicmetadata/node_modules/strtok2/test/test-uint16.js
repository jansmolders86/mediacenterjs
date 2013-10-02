// Test writing and reading uint16 values in different endiannesses.

var assert = require('assert');
var util = require('./util');
var strtok = require('../lib/strtok');

util.runGenerateTests(
    [function(b) {
        var len = strtok.UINT16_LE.put(b, 0, 0);
        return len + strtok.UINT16_LE.put(b, len, 0xffaa)
    }, '\x00\x00\xaa\xff'],
    [function(b) {
        var len = strtok.UINT16_BE.put(b, 0, 0xf);
        return len + strtok.UINT16_BE.put(b, len, 0xffaa)
    }, '\x00\x0f\xff\xaa'],
    [function(b) {
        var len = strtok.UINT16_BE.put(b, 0, 0xffaa)
        return len + strtok.UINT16_LE.put(b, len, 0xffaa)
    }, '\xff\xaa\xaa\xff']
);

var le = function(v) {
    assert.equal(v, 0x001a);
    return strtok.UINT16_BE;
};

var be = function(v) {
    assert.equal(v, 0x1a00);
    return strtok.UINT16_LE;
};

util.runParseTests('\x1a\x00\x1a\x00\x1a\x00\x1a\x00', [
    function(v) {
        assert.ok(v === undefined);
        return strtok.UINT16_LE;
    },
    le, be, le, be
]);
