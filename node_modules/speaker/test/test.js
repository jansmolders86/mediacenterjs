
/**
 * Module dependencies.
 */

var os = require('os');
var assert = require('assert');
var Speaker = require('../');
var endianness = 'function' == os.endianness ? os.endianness() : 'LE';
var opposite = endianness == 'LE' ? 'BE' : 'LE';

describe('exports', function () {

  it('should export a Function', function () {
    assert.equal('function', typeof Speaker);
  });

  it('should have an "api_version" property', function () {
    assert(Speaker.hasOwnProperty('api_version'));
    assert('number', typeof Speaker.api_version);
  });

  it('should have a "description" property', function () {
    assert(Speaker.hasOwnProperty('description'));
    assert('string', typeof Speaker.description);
  });

  it('should have a "module_name" property', function () {
    assert(Speaker.hasOwnProperty('module_name'));
    assert('string', typeof Speaker.module_name);
  });

});

describe('Speaker', function () {

  it('should return a Speaker instance', function () {
    var s = new Speaker();
    assert(s instanceof Speaker);
  });

  it('should be a writable stream', function () {
    var s = new Speaker();
    assert.equal(s.writable, true);
    assert.notEqual(s.readable, true);
  });

  it('should emit an "open" event after the first write()', function (done) {
    var s = new Speaker();
    var called = false;
    s.on('open', function () {
      called = true;
      done();
    });
    assert.equal(called, false);
    s.write(Buffer(0));
  });

  it('should emit a "flush" event after end()', function (done) {
    var s = new Speaker();
    var called = false;
    s.on('flush', function () {
      called = true;
      done();
    });
    assert.equal(called, false);
    s.end(Buffer(0));
  });

  it('should emit a "close" event after end()', function (done) {
    this.slow(1000);
    var s = new Speaker();
    var called = false;
    s.on('close', function () {
      called = true;
      done();
    });
    assert.equal(called, false);
    s.end(Buffer(0));
  });

  it('should only emit one "close" event', function (done) {
    var s = new Speaker();
    var count = 0;
    s.on('close', function () {
      count++;
    });
    assert.equal(0, count);
    s.close();
    assert.equal(1, count);
    s.close();
    assert.equal(1, count);
    done();
  });

  it('should not throw an Error if native endianness is specified', function () {
    assert.doesNotThrow(function () {
      new Speaker({ endianness: endianness });
    });
  });

  it('should throw an Error if non-native endianness is specified', function () {
    assert.throws(function () {
      new Speaker({ endianness: opposite });
    });
  });

});
