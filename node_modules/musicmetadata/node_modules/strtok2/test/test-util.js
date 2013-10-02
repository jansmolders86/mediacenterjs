// Test our utilities

var assert = require('assert');
var SinkStream = require('./util').SinkStream;

var s = new SinkStream();
s.write('abcdef');
assert.strictEqual(s.getBuffer().toString('binary'), 'abcdef');

var s = new SinkStream();
s.write('\x01\x02\x03\xff', 'binary');
assert.strictEqual(s.getBuffer().toString('binary'), '\x01\x02\x03\xff');

var s = new SinkStream(4);
s.write('abcdef');
s.write('qqqb');
assert.strictEqual(s.getBuffer().toString('binary'), 'abcdefqqqb');
