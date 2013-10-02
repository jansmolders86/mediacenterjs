// Test reading an array of bytes.

var assert = require('assert');
var util = require('./util');
var strtok = require('../lib/strtok');

util.runParseTests('\x05peter', [
    function(v) {
        assert.ok(v === undefined);
        return strtok.UINT8;
    },
    function(v) {
        assert.ok(typeof v === 'number');
        return new strtok.BufferType(v);
    },
    function(v) {
        assert.ok(typeof v === 'object');
        assert.equal(v.toString('utf-8'), 'peter');
        return strtok.DONE;
    }
]);
