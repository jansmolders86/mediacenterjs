// Test reading int32 values.

var assert = require('assert');
var util = require('./util');
var strtok = require('../lib/strtok');

util.runGenerateTests(
    [function(b) {
        return strtok.INT32_BE.put(b, 0, 0x00);
    }, '\x00\x00\x00\x00'],
    [function(b) {
        return strtok.INT32_BE.put(b, 0, 0x0f0bcca0);
    }, '\x0f\x0b\xcc\xa0'],
    [function(b) {
        return strtok.INT32_BE.put(b, 0, -0x0f0bcca0);
    }, '\xf0\xf4\x33\x60']
);

util.runParseTests('\x00\x00\x00\x00\xff\xff\xff\xff\x00\x10\x00\xff\x80\x00\x00\x00', [
    function(v) {
        assert.ok(v === undefined);
        return strtok.INT32_BE;
    },
    function(v) {
        assert.equal(v, 0);
        return strtok.INT32_BE;
    },
    function(v) {
        assert.equal(v, -1);
        return strtok.INT32_BE;
    },
    function(v) {
        assert.equal(v, 1048831);
        return strtok.INT32_BE;
    },
    function(v) {
        assert.equal(v, -2147483648);
        return strtok.INT32_BE;
    }
]);
