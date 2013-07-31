node-speaker
============
### Output [PCM audio][pcm] data to the speakers
[![Build Status](https://secure.travis-ci.org/TooTallNate/node-speaker.png)](http://travis-ci.org/TooTallNate/node-speaker)


A Writable stream instance that accepts [PCM audio][pcm] data and outputs it
to the speakers. The output is backed by `mpg123`'s audio output modules, which
in turn use any number of audio backends commonly found on Operating Systems
these days.


Installation
------------

Simply compile and install `node-speaker` using `npm`:

``` bash
$ npm install speaker
```

On Debian/Ubuntu, the ALSA backend is selected by default, so be sure to have the
`alsa.h` header file in place:

``` bash
$ sudo apt-get install libasound2-dev
```


Example
-------

Here's an example of piping `stdin` to the speaker, which should be 2 channel,
16-bit audio at 44,100 samples per second (a.k.a CD quality audio).

``` javascript
var Speaker = require('speaker');

// Create the Speaker instance
var speaker = new Speaker({
  channels: 2,          // 2 channels
  bitDepth: 16,         // 16-bit samples
  sampleRate: 44100     // 44,100 Hz sample rate
});

// PCM data from stdin gets piped into the speaker
process.stdin.pipe(speaker);
```


API
---

`require('speaker')` directly returns the `Speaker` constructor. It is the only
interface exported by `node-speaker`.

### new Speaker([ format ]) -> Speaker instance;

Creates a new `Speaker` instance, which is a writable stream that you can pipe
PCM audio data to. The optional `format` object may contain any of the `Writable`
base class options, as well as any of these PCM formatting options:

  * `channels` - The number of audio channels. PCM data must be interleaved. Defaults to `2`.
  * `bitDepth` - The number of bits per sample. Defaults to `16` (16-bit).
  * `sampleRate` - The number of samples per second per channel. Defaults to `44100`.
  * `signed` - Boolean specifying if the samples are signed or unsigned. Defaults to `true` when bit depth is 8-bit, `false` otherwise.
  * `samplesPerFrame` The number of samples to send to the audio backend at a time. You likely don't need to mess with this value. Defaults to `1024`.

#### "open" event

Fired when the backend `open()` call has completed. This happens once the first
`write()` call happens on the speaker instance.

#### "flush" event

Fired after the speaker instance has had `end()` called, and after the audio data
has been flushed to the speakers.

#### "close" event

Fired after the "flush" event, after the backend `close()` call has completed.
This speaker instance is essentially finished after this point.


Audio Backend Selection
-----------------------

`node-speaker` is backed by `mpg123`'s "output modules", which in turn use one of
many popular audio backends like ALSA, OSS, SDL, and lots more. The default
backends for each operating system are described in the table below:

| **Operating System** | **Audio Backend** | **Description**
|:---------------------|:------------------|:----------------------------------
| Linux                | `alsa`            | Output audio using Advanced Linux Sound Architecture (ALSA).
| Mac OS X             | `coreaudio`       | Output audio using Mac OS X's CoreAudio.
| Windows              | `win32`           | Audio output for Windows (winmm).
| Solaris              | `sun`             | Audio output for Sun Audio.

To manually override the default backend, pass the `--mpg123-backend` switch to
`npm`/`node-gyp`:

``` bash
$ npm install speaker --mpg123-backend=openal
```

[pcm]: http://en.wikipedia.org/wiki/Pulse-code_modulation
