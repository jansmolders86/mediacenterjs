// Test reading an array of bytes.

var assert = require('assert');
var util = require('./util');
var strtok = require('../lib/strtok');

util.runParseTests('\x04asdfaoeu', [
    function(v) {
        assert.ok(v === undefined);
        return strtok.UINT8;
    },
    function(v) {
        assert.strictEqual(v, 4);
        return new strtok.IgnoreType(4);
    },
    function(v) {
        assert.equal(v, null);
        return new strtok.BufferType(4);
    },
    function(v) {
        assert.ok(Buffer.isBuffer(v));
        assert.equal(v.toString('utf8'), 'aoeu');
        return strtok.DONE;
    }
]);

