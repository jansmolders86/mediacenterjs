// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied. See the License for the specific language governing
// permissions and limitations under the License.

var fs = require('fs');
var puts = require('util').puts;

// The "Schema" constructor lets you load a protocol schema definition
// (a compiled .proto file).
var Schema = require('protobuf_for_node').Schema;

// "schema" contains all message types defined in feeds.proto|desc.
var schema = new Schema(fs.readFileSync('example/feeds.desc'));
// The "Feed" message.
var Feed = schema['feeds.Feed'];

// Serializes a JS object to a protocol message in a node buffer
// according to the protocol message schema.
var serialized = Feed.serialize({ title: 'Title', ignored: 42 });

// Parses a protocol message in a node buffer into a JS object
// according to the protocol message schema.
var aFeed = Feed.parse(serialized);  

// The "ignored" field has been dropped.
puts("Message after roundtrip: " + JSON.stringify(aFeed, null, 2));

// Each protocol message type has its own prototype. You can attach
// methods to parsed protocol messages.
Feed.prototype.numEntries = function() {
  return this.entry.length;
};
var aFeed = Feed.parse(Feed.serialize({ entry: [{}, {}] }));
puts("Number of entries: " + aFeed.numEntries());

// Performance is (only) on par with builtin JSON serialization.
var t = Date.now();
for (var i = 0; i < 100000; i++)
  Feed.parse(Feed.serialize({ entry: [{}, {}] }));
puts("Proto: " + (Date.now() - t)/100 + " us / object");

var t = Date.now();
for (var i = 0; i < 100000; i++)
  JSON.parse(JSON.stringify({ entry: [{}, {}] }));
puts("JSON: " + (Date.now() - t)/100 + " us / object");
