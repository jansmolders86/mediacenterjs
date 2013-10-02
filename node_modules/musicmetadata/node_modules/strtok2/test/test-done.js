// Verify that the DONE value is respected.

var assert = require('assert');
var Buffer = require('buffer').Buffer;
var EventEmitter = require('events').EventEmitter;
var util = require('./util');
var strtok = require('../lib/strtok');

util.runParseTests('\x1a\x1a\x1a\x1a\x1a\x1a', [
    function(v) {
        assert.ok(v === undefined);
        return strtok.UINT8;
    },
    function(v) {
        return strtok.DONE;
    }
]);

var s = new EventEmitter();
strtok.parse(s, (function() {
    var bufsSeen = [];

    process.on('exit', function() {
        assert.equal(bufsSeen.length, 2);
        assert.equal(
            bufsSeen[0].toString('binary'),
            '\x11\x22'
        );
        assert.equal(
            bufsSeen[1].toString('binary'),
            'abcdef\xff'
        );
    });

    return function(v) {
        if (v === undefined) {
            return strtok.UINT8;
        }

        assert.equal(v, 0xff);

        s.on('data', function(b) {
            bufsSeen.push(b);
        });

        return strtok.DONE;
    };
})());

s.emit('data', new Buffer('\xff\x11\x22', 'binary'));
s.emit('data', new Buffer('abcdef\xff', 'binary'));
