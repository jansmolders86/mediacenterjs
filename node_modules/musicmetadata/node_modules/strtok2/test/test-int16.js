// Test reading int16 values.

var assert = require('assert');
var util = require('./util');
var strtok = require('../lib/strtok');

util.runGenerateTests(
    [function(b) {
        return strtok.INT16_BE.put(b, 0, 0x00);
    }, '\x00\x00'],
    [function(b) {
        return strtok.INT16_BE.put(b, 0, 0x0f0b);
    }, '\x0f\x0b'],
    [function(b) {
        return strtok.INT16_BE.put(b, 0, -0x0f0b);
    }, '\xf0\xf5']
);

util.runParseTests('\x0a\x1a\x00\x00\xff\xff\x80\x00', [
    function(v) {
        assert.ok(v === undefined);
        return strtok.INT16_BE;
    },
    function(v) {
        assert.equal(v, 2586);
        return strtok.INT16_BE;
    },
    function(v) {
        assert.equal(v, 0);
        return strtok.INT16_BE;
    },
    function(v) {
        assert.equal(v, -1);
        return strtok.INT16_BE;
    },
    function(v) {
        assert.equal(v, -32768);
        return strtok.INT16_BE;
    }
]);
