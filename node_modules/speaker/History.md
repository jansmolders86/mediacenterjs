0.0.10 / 2013-05-08
===================

 - pass the "open" error the the Speaker instance. Closes #11.
 - package: add "sound" as a keyword
 - travis: test node v0.10

0.0.9 / 2013-03-06
==================

 - update for v0.9.12 Writable stream API change
 - a couple more jsdoc comments

0.0.8 / 2013-02-10
==================

 - throw an Error if non-native endianness is specified

0.0.7 / 2013-01-14
==================

 - wait for the `format` event on pipe'd Readable instances
 - default the lowWaterMark and highWaterMark to 0
 - rename _opts() to _format()
 - package: allow any "readable-stream" version
 - add a few more debug calls

0.0.6 / 2012-12-15
==================

 - add node >= v0.9.4 compat

0.0.5 / 2012-11-16
==================

 - add initial tests (uses the "dummy" output module)
 - add "float" (32-bit and 64-bit) output support
 - ensure only one "close" event

0.0.4 / 2012-11-04
==================

 - mpg123: add linux arm support
 - guard against bindings that don't have a `deinit()` function

0.0.3 / 2012-11-03
==================

 - a two examples to the "examples" dir
 - emit an "open" event
 - emit a "close" event
 - emit a "flush" event
 - properly support the "pipe" event
 - mpg123: fix a CoreAudio backend compilation warning
 - add a timeout after the flush call to ensure the backend has time to play

0.0.2 / 2012-10-25
==================

 - support for Windows
 - support for Linux
 - support for Solaris
 - call `flush()` and `close()` at the end of the stream

0.0.1 / 2012-10-24
==================

 - Initial release
