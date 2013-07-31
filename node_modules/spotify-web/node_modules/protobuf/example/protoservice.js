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

var puts = require('util').puts;
var pwd = require('protoservice');

// Synchronous service call. This is only possible if the service
// implementation is synchronous, too, i.e. invokes the Done closure
// before returning. Otherwise this will fail.
var entries = pwd.sync.GetEntries({});
puts(entries.entry.length + " users");

// Synchronous implementations can be called callback style, too.
// They will automatically be placed on the eio thred pool. This is
// good for blocking or CPU-consuming tasks.
pwd.sync.GetEntries({}, function(entries) {
    // This will print last.
    puts("sync: " + entries.entry.length + " users");
});
puts("Getting entries asynchronously from sync service ...");

// Invocations of async services (ones that call "Done" only after the
// initial service call returns) must be called callback-style.
pwd.async.GetEntries({}, function(entries) {
    // This will print last.
    puts("async: " + entries.entry.length + " users");
});
puts("Getting entries asynchronously from async service ...");
