
/**
 * Pipe data to stdin and it will be played through your speakers.
 */

var Speaker = require('../');

var speaker = new Speaker();
process.stdin.pipe(speaker);
