*** this fork is published as the npm module `strtok2` ***


A streaming tokenizer for [NodeJS](http://nodejs.org).

Parsing data coming off the wire in an event-driven environment can be a
difficult proposition, with naive implementations buffering all received data
in memory until a message has been received in its entirety. Not only is this
inefficient from a memory standpoint, but it may not be possible to determine
the that a message has been fully received without attempting to parse it.
This requires a parser that can gracefully handle incomplete messages and
pick up where it left off. To make this task easier, `node-strtok` provides

* Tokenizing primitives for common network datatypes (e.g. signed and
  unsigned integers in variois endian-nesses).
* A callback-driven approach well suited to an asynchronous environment (e.g.
  to allow the application to asynchronously ask another party for
  information about what the next type should be)
* An easily extensible type system for adding support for new,
  application-defined types to the core.
* Very good performance; the built-in MsgPack parser performs within 30% of
  the native C++ implementation.

## Usage

The `node-strtok` library has only one method: `parse()`.  This method takes a
`net.Stream` (really any `EventEmitter` that pumps out `data` events) and a
callback, which is invoked when a complete token has been read from the stream.
The callback takes a single argument: the token just read from the stream, and
is expected to return the type of token to read from the stream next (e.g.
`strtok.UINT32_BE`). It is this callback that ultimately implements the
application protocol, consuming the provided tokens and instructing
`node-strtok` the type of the next token to read. It is this inverted control
flow that allows `node-strtok` to function efficiently as an interruptable
parser well suited to NodeJS.

The meat of implementing an application protocol is to be found in what it does
in its callback function.

When `parse()` is invoked, it immediately invokes the callback with a value of
`undefined`. In this way, the application can indicate the type of token to
read from the stream first. For example, the MsgPack implementation always
reads a `strtok.UINT8` when it doesn't know what's coming next; it interprets
the resulting value as a type (e.g. integer, array, etc) to determine what type
of value is coming next.

Implicit in this model is that the callback itself must maintain all
protocol-specific state on its own. Often this will include what type of
structure it's attmpting to parse from the stream, and the progress made so far
in parsing that structure.

### Tokens

`node-strtok` supports a wide variety of numerical tokens out of the box:

* `UINT8`
* `UINT16_BE`, `UINT16_LE`
* `UINT32_BE`,  `UINT32_LE`
* `INT8`
* `INT16_BE`
* `INT32_BE`

One might notice that there is no support for 64-bit tokens, since JavaScript
seems to limit value size to less than 2^64. Rather than wrapping up an
additional math library to handle this, I wanted to stick with JavaScript
primitives. Maybe this will change later if this becomes important.

#### Special tokens

There are a handful of "special" tokens which have special meaning when
returned from the protocol callback: `DONE` and `DEFER`. 

The `DONE` token indicates to `strtok.parse()` that the protocol parsing loop
has come to an end, and that no more data need be read off of the stream. This
causes `strtok.parse()` to disengage from the stream. The callback will not be
invoked again. In addition, upon receiving `DONE`, `strtok.parse()` may have
excess data buffers which it has pulled off of the stream, but which it did not
consume while being directed by the protocol callback. Rather than dropping
this data on the floor, `strtok.parse()` will synthesize and emit `data` events
on the stream which it was operating on. The idea is to facilitate protocol
stacks which want to use `node-strtok` to parse some portion of the protocol
and then hand off processing to some other codepath(s). In this case, it is
expected that the protocol callback will add `data` event listeners to the
stream immediately before returning `DONE`.

The `DEFER` token indicates that the protocol doesn't know what type of token
to read from the stream next. Perhaps the protocol needs to consult some
out-of-process datastructure, or wait for some other event to occur. To support
this case, the protocol callback is actually invoked with 2 arguments: the
value and a defer callback. It is this second parameter, a callback, that must
be invoked with the desired token type once the protocol layer has figured this
out. Note that between the time `DEFER` is returned and the callback is
invoked, `strtok.parse()` is buffering all data received from the stream.

#### Complex tokens

The token types returned from the protocol callback are simply objects with
1) a `get()` method that takes a `Buffer` and an offset and returns the token
value, and 2) a `len` field that indicates the number of bytes to consume.
Any JavaScript object that meets this criteria can be returned from the
protocol callback. `node-strtok` ships with two built-in types for supporting
common behavior that take advantage of this

* `BufferType` -- consume a fixed number of bytes from the stream and
  return a `Buffer` instance containing these bytes.
* `StringType` -- consume a fixed number of bytes from the stream and
  return a string with a specified encoding.

Implementing such types is extremely simple. The `BufferType` implementation
is given below:

    var BufferType = function(l) {
        var self = this;

        self.len = l;

        self.get = function(buf, off) {
            return buf.slice(off, off + this.len);
        };
    };
    exports.BufferType = BufferType;

### A simple example

Below is an example of a parser for a simple protocol. Each message is a
UTF-8 string, prefixed with a big-endian unsigned 32-bit integer used as a
length specifier.

    var strotk = require('strtok');

    var s = ... /* a net.Stream workalike */;
    
    var numBytes = -1;
    
    strtok.parse(s, function(v, cb) {
        if (v === undefined) {
            return strtok.UINT32_BE;
        }
    
        if (numBytes == -1) {
            numBytes = v;
            return new strtok.StringType(v, 'utf-8');
        }

        console.log('Read ' + v);
        numBytes = -1;
        return strtok.UINT32_BE;
    });

When the callback is first invoked, we aren't in the midst of reading a
message, so we ask for a `UINT32_BE` to get the length of the subsequent
string. At this point, on every invocation of our callback, we use our
internal `numBytes` variable to determine if we're reading a number-of-bytes
value or a string value. In the former case, we're called with the
number-of-bytes value and return a `StringType` instance that knows to read
the specified number of bytes from the stream. In the latter case, we get the
string itself, log it, and then ask for a length again. Lather, rinse,
repeat.

### A more complex example

The
[examples/msgpack/msgpack.js](http://github.com/pgriess/node-strtok/blob/master/examples/msgpack/msgpack.js)
file contains an implementation of the [MsgPack serialization
spec](http://redmine.msgpack.org/projects/msgpack/wiki/FormatSpec).

## Performance

An example run of the built-in `examples/msgpack/bench.js`:

    json
      pack:   14674 ms (100% of json)
      unpack: 50479 ms (100% of json)

    native
      pack:   15334 ms (104% of json)
      unpack: 32835 ms (65% of json)

    strtok
      pack:   15861 ms (108% of json)
      unpack: 46650 ms (92% of json)
