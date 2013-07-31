
/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var protobuf = require('protobuf');

/**
 * Protocol Buffer schemas.
 */

var proto = path.resolve(__dirname, '..', 'proto');

// mercury.proto
exports.mercury = new protobuf.Schema(fs.readFileSync(path.resolve(proto, 'mercury.desc')));

// metadata.proto
exports.metadata = new protobuf.Schema(fs.readFileSync(path.resolve(proto, 'metadata.desc')));

// playlist4meta.proto
exports.playlist4meta = new protobuf.Schema(fs.readFileSync(path.resolve(proto, 'playlist4meta.desc')));

// playlist4issues.proto
exports.playlist4issues = new protobuf.Schema(fs.readFileSync(path.resolve(proto, 'playlist4issues.desc')));

// playlist4opts.proto
exports.playlist4ops = new protobuf.Schema(fs.readFileSync(path.resolve(proto, 'playlist4ops.desc')));

// playlist4content.proto
exports.playlist4content = new protobuf.Schema(fs.readFileSync(path.resolve(proto, 'playlist4content.desc')));

// playlist4changes.proto
exports.playlist4changes = new protobuf.Schema(fs.readFileSync(path.resolve(proto, 'playlist4changes.desc')));

// toplist.proto
exports.toplist = new protobuf.Schema(fs.readFileSync(path.resolve(proto, 'toplist.desc')));
