// Verify that we can read a MsgPack stream.

var assert = require('assert');
var Buffer = require('buffer').Buffer;
var strtok = require('../../lib/strtok');

var PACKBUF = new Buffer(1024);

// Generator function for handing to strtok.parse(); takes an accumulator
// callback to invoke when a top-level type is read from the stream
var strtokParser = function(acc) {
    // Type that we're in when reading a primitive; MSGPACK_* values
    var type = undefined;

    // Type types; only MsgPack primitives that require reading more than a
    // single octet are represented here
    var MSGPACK_UINT8 = 0;
    var MSGPACK_UINT16 = 1;
    var MSGPACK_UINT32 = 2;
    var MSGPACK_INT8 = 3;
    var MSGPACK_INT16 = 4;
    var MSGPACK_INT32 = 5;
    var MSGPACK_ARRAY16 = 6;
    var MSGPACK_ARRAY32 = 7;
    var MSGPACK_RAW = 8;
    var MSGPACK_RAW16 = 9;
    var MSGPACK_RAW32 = 10;
    var MSGPACK_RAW_FINISH = 11;
    var MSGPACK_MAP16 = 12;
    var MSGPACK_MAP32 = 13;

    // Unpack a binary string
    var rawStringType = new strtok.StringType(0, 'binary');

    // Return a function for unpacking an array
    var unpackArray = function(nvals, oldAcc) {
        var arr = [];

        if (nvals === 0) {
            acc(arr);
            return oldAcc;
        }

        return function(v) {
            arr.push(v);

            if (arr.length >= nvals) {
                acc = oldAcc;
                acc(arr);
            }
        };
    };

    // Return a function for unpacking a map
    var unpackMap = function(nvals, oldAcc) {
        var o = {};
        var k = undefined;
        var numKeys = 0;

        if (nvals === 0) {
            acc(o);
            return oldAcc;
        }

        return function(v) {
            if (k === undefined) {
                k = v;
                return;
            }

            o[k] = v;
            k = undefined;

            if (++numKeys === nvals) {
                acc = oldAcc;
                acc(o);
            }
        };
    };

    // Parse a single primitive value, calling acc() as values
    // are accumulated
    return function(v) {
        if (v === undefined) {
            return strtok.UINT8;
        }

        switch (type) {
        case undefined:
            // We're reading the first byte of our type. Either we have a
            // single-byte primitive (we accumulate now), a multi-byte
            // primitive (we set our type and accumulate when we've
            // finished reading the primitive from the stream), or we have a
            // complex type.

            // positive fixnum
            if ((v & 0x80) == 0x0) {
                acc(v);
                break;
            }

            // negative fixnum
            if ((v & 0xe0) == 0xe0) {
                acc(-1 * (~v & 0xff) - 1);
                break;
            }

            // uint8
            if (v == 0xcc) {
                type = MSGPACK_UINT8;
                break;
            }

            // uint16
            if (v == 0xcd) {
                type = MSGPACK_UINT16;
                return strtok.UINT16_BE;
            }

            // uint32
            if (v == 0xce) {
                type = MSGPACK_UINT32;
                return strtok.UINT32_BE;
            }

            // null/undefined
            if (v == 0xc0) {
                acc(null);
                break;
            }

            // true
            if (v == 0xc3) {
                acc(true);
                break;
            }

            // false
            if (v == 0xc2) {
                acc(false);
                break;
            }

            // int8
            if (v == 0xd0) {
                type = MSGPACK_INT8;
                return strtok.INT8;
            }

            // int16
            if (v == 0xd1) {
                type = MSGPACK_INT16;
                return strtok.INT16_BE;
            }

            // int32
            if (v == 0xd2) {
                type = MSGPACK_INT32;
                return strtok.INT32_BE;
            }

            // fix array
            if ((v & 0xf0) === 0x90) {
                acc = unpackArray(v & 0x0f, acc);
                break;
            }

            // array16
            if (v == 0xdc) {
                type = MSGPACK_ARRAY16;
                return strtok.UINT16_BE;
            }

            // array32
            if (v == 0xdd) {
                type = MSGPACK_ARRAY32;
                return strtok.UINT32_BE;
            }

            // fixraw
            if ((v & 0xe0) == 0xa0) {
                type = MSGPACK_RAW;
                rawStringType.len = v & ~0xe0;
                return rawStringType;
            }

            // raw16
            if (v == 0xda) {
                type = MSGPACK_RAW16;
                return strtok.UINT16_BE;
            }

            // raw32
            if (v == 0xdb) {
                type = MSGPACK_RAW32;
                return strtok.UINT32_BE;
            }

            // fixmap
            if ((v & 0xf0) == 0x80) {
                acc = unpackMap(v & 0x0f, acc);
                break;
            }

            // map16
            if (v == 0xde) {
                type = MSGPACK_MAP16;
                return strtok.UINT16_BE;
            }

            // map32
            if (v == 0xdf) {
                type = MSGPACK_MAP32;
                return strtok.UINT32_BE;
            }

            console.error('unexpected type: ' + v + '; aborting');
            return strtok.DONE;

        case MSGPACK_UINT8:
        case MSGPACK_UINT16:
        case MSGPACK_UINT32:
        case MSGPACK_INT8:
        case MSGPACK_INT16:
        case MSGPACK_INT32:
        case MSGPACK_RAW:
        case MSGPACK_RAW_FINISH:
            acc(v);
            type = undefined;
            break;

        case MSGPACK_ARRAY16:
        case MSGPACK_ARRAY32:
            acc = unpackArray(v, acc);
            type = undefined;
            break;

        case MSGPACK_RAW16:
        case MSGPACK_RAW32:
            type = MSGPACK_RAW_FINISH;
            rawStringType.len = v;
            return rawStringType;

        case MSGPACK_MAP16:
        case MSGPACK_MAP32:
            acc = unpackMap(v, acc);
            type = undefined;
            break;
        }

        // We're reading a new primitive; go get it
        return strtok.UINT8;
    };
};
exports.strtokParser = strtokParser;

// Write the length component of a 'raw' type
var writeRawLength = function(b, bo, l, flush) {
    if (l <= 31) {
        // fixraw
        return strtok.UINT8.put(b, bo, 0xa0 | l, flush);
    } else if (l <= 0xffff) {
        // raw16
        var len = strtok.UINT8.put(b, bo, 0xda, flush);
        return len + strtok.UINT16_BE.put(b, bo + len, l, flush);
    } else if (l <= 0xffffffff) {
        // raw32
        var len = strtok.UINT8.put(b, bo, 0xdb, flush);
        return len + strtok.UINT32_BE.put(b, bo + len, l, flush);
    } else {
        throw new Error('Raw too large for serialization!');
    }
}

// Pack a value into the given stream (or buffer and offset), flushing using
// the provided function.
var pack = function(s, b, bo, v, flush) {
    b = (b === undefined) ? PACKBUF : b;
    bo = (bo === undefined) ? 0 : bo;
    v = (v === null) ? undefined : v;
    flush = (flush === undefined && s !== undefined) ?
        function(b, o) {
            s.write(b.toString('binary', 0, o), 'binary');
        } : flush;

    switch (typeof v) {
    case 'undefined':
        return strtok.UINT8.put(b, bo, 0xc0, flush);

    case 'boolean':
        return strtok.UINT8.put(b, bo, (v) ? 0xc3 : 0xc2, flush);

    case 'number':
        if (v >= 0) {
            // positive fixnum
            if (v <= 127) {
                return strtok.UINT8.put(b, bo, v, flush);
            } 
          
            // uint8
            if (v <= 0xff) {
                var len = strtok.UINT8.put(b, bo, 0xcc, flush);
                return len + strtok.UINT8.put(b, bo + len, v, flush);
            }

            // uint16
            if (v <= 0xffff) {
                var len = strtok.UINT8.put(b, bo, 0xcd, flush);
                return len + strtok.UINT16_BE.put(b, bo + len, v, flush);
            }
           
            // uint32
            if (v <= 0xffffffff) {
                var len = strtok.UINT8.put(b, bo, 0xce, flush);
                return len + strtok.UINT32_BE.put(b, bo + len, v, flush);
            }
        } else {
            // negative fixnum
            if (v >= -32) {
                return strtok.UINT8.put(b, bo, v & 0xff, flush);
            }
           
            // int8
            if (v >= -128) {
                var len = strtok.UINT8.put(b, bo, 0xd0, flush);
                return len + strtok.INT8.put(b, bo + len, v, flush);
            }

            // int16
            if (v >= -32768) {
                var len = strtok.UINT8.put(b, bo, 0xd1, flush);
                return len + strtok.INT16_BE.put(b, bo + len, v, flush);
            }

            // int32
            if (v >= -2147483648) {
                var len = strtok.UINT8.put(b, bo, 0xd2, flush);
                return len + strtok.INT32_BE.put(b, bo + len, v, flush);
            }
        }

        throw new Error('Cannot handle 64-bit numbers');
   
    case 'object':
        var len = 0;

        if (Array.isArray(v)) {
            if (v.length <= 15) {
                // fix array
                len = strtok.UINT8.put(b, bo, 0x90 | v.length, flush);
            } else if (v.length <= 0xffff) {
                // array16
                len = strtok.UINT8.put(b, bo, 0xdc, flush);
                len += strtok.UINT16_BE.put(b, bo + len, v.length, flush);
            } else if (v.length <= 0xffffffff) {
                // array32
                len = strtok.UINT8.put(b, bo, 0xdd, flush);
                len += strtok.UINT32_BE.put(b, bo + len, v.length, flush);
            } else {
                throw new Error('Array too large for serialization!');
            }

            v.forEach(function(vv) {
                len += pack(s, b, bo + len, vv, flush);
            });
        } else if (v instanceof Buffer) {
            var len = writeRawLength(b, bo, v.length, flush);
            
            if (s !== undefined) {
                flush(b, bo + len);
                len = -1 * bo;
                s.write(v);
            } else {
                if (v.length > b.length) {
                    throw new Error(
                        'Target buffer too small for serializing buffer of length ' + v.length
                    );
                } else if (bo + len + v.length > b.length) {
                    flush(b, bo + len);
                    len = -1 * bo;
                    len += v.copy(b, 0, 0, v.length);
                } else {
                    len += v.copy(b, bo + len, 0, v.length);
                }
            }
        } else {
            var vk = Object.keys(v);
            if (vk.length <= 15) {
                // fixmap
                len = strtok.UINT8.put(b, bo, 0x80 | vk.length, flush);
            } else if (vk.length <= 0xffff) {
                // map16
                len = strtok.UINT8.put(b, bo, 0xde, flush);
                len += strtok.UINT16_BE.put(b, bo + len, vk.length, flush);
            } else if (vk.length <= 0xffffffff) {
                // map32
                len = strtok.UINT8.put(b, bo, 0xdf, flush);
                len += strtok.UINT32_BE.put(b, bo + len, vk.length, flush);
            } else {
                throw new Error('Object too large for serialization!');
            }

            vk.forEach(function(k) {
                len += pack(s, b, bo + len, k, flush);
                len += pack(s, b, bo + len, v[k], flush);
            });
        }

        return len;

    case 'string':
        var len = writeRawLength(b, bo, Buffer.byteLength(v, 'utf-8'), flush);

        if (s !== undefined) {
            flush(b, bo + len);
            len = -1 * bo;
            s.write(v, 'utf-8');
        } else {
            if (v.length > b.length) {
                throw new Error(
                    'Target buffer too small for serializing string of length ' + v.length
                );
            } else if (bo + len + v.length > b.length) {
                flush(b, bo + len);
                len = -1 * bo;
                len += b.write(v, 0, 'utf-8');
            } else {
                len += b.write(v, bo + len, 'utf-8');
            }
        }

        return len;

    default:
        throw new Error('Cannot handle object of type ' + typeof v);
    }
};
exports.pack = pack;

var packBuf = function(b, bo, v) {
    return pack(undefined /* stream */, b, bo, v, undefined /* flush */);
};
exports.packBuf = packBuf;

var packStream = function(s, v) {
    var off = pack(
        s, undefined /* buf */, undefined /* buf offset */, v,
        function(b, bo) {
            s.write(b.toString('binary', 0, bo), 'binary');
        }
    );

    s.write(PACKBUF.toString('binary', 0, off), 'binary');
};
exports.packStream = packStream;
