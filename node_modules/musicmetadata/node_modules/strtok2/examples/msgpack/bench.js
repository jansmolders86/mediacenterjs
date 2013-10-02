// Benchmark unpacking performance of node-strtok vs. node-msgpack

var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var nodeMsgpack = require('msgpack');
var strtok = require('../../lib/strtok');
var strtokMsgpack = require('./msgpack');
var sys = require('sys');
var util = require('../../test/util');

var NUM_OBJS = 1000000;
var OBJ_TEMPLATE = {'abcdef' : 1, 'qqq' : 13, '19' : [1, 2, 3, 4]};

var TYPE_CBS = [
    ['json',
        
        // pack
        (function() {
            var objs = [];
            for (var i = 0; i < NUM_OBJS; i++) {
                objs.push(JSON.parse(JSON.stringify(OBJ_TEMPLATE)));
            }

            var i = 0;
            return function() {
                return JSON.stringify(objs[++i % NUM_OBJS]);
            }
        })(),

        // unpack
        (function() {
            var str = JSON.stringify(OBJ_TEMPLATE);

            return function(cb) {
                process.nextTick(function() {
                    JSON.parse(str);
                    cb();
                });
            };
        })()
    ],

    ['native',

        // pack
        function() {
            nodeMsgpack.pack(OBJ_TEMPLATE);
        },

        // unpack
        (function() {
            var buf = nodeMsgpack.pack(OBJ_TEMPLATE);

            return function(cb) {
                var e = new EventEmitter();

                e.on('data', function(b) {
                    nodeMsgpack.unpack(b);
                    cb();
                });

                process.nextTick(function() {
                    e.emit('data', buf);
                    e.emit('end');
                });
            }
        })()
    ],

    ['strtok',

        // pack
        (function() {
            var s = new util.NullStream();

            return function() {
                strtokMsgpack.packStream(s, OBJ_TEMPLATE);
            };
        })(),

        // unpack
        (function() {
            var buf = nodeMsgpack.pack(OBJ_TEMPLATE);

            return function(cb) {
                var e = new EventEmitter();
                var tag = Math.random();
                strtok.parse(e, strtokMsgpack.strtokParser(function (v) {
                    cb();
                }));

                process.nextTick(function() {
                    e.emit('data', buf);
                    e.emit('end');
                });
            };
        })()
    ]
];

var jsonPack, jsonUnpack;

function benchmarkType(typeNum) {
    var name = TYPE_CBS[typeNum][0];
    var pack = TYPE_CBS[typeNum][1];
    var unpack = TYPE_CBS[typeNum][2];

    console.log(name);

    // Pack
    var begin = Date.now();
    for (var i = 0; i < NUM_OBJS; i++) {
        pack();
    }

    var packTime = (Date.now() - begin)
    if (typeNum === 0) {
        jsonPack = packTime;
    }
    console.log(
        '  pack:   ' + packTime + ' ms ' +
        '(' + Math.round(((100 * packTime) / jsonPack)) + '% of json)'
    );

    // Unpack
    begin = Date.now();
    var i = 0;
    var unpackCB = function() {
        if (++i < NUM_OBJS) {
            unpack(unpackCB);
            return;
        }

        var unpackTime = (Date.now() - begin);
        if (typeNum === 0) {
            jsonUnpack = unpackTime;
        }

        console.log(
            '  unpack: ' + unpackTime + ' ms ' +
            '(' + Math.round(((100 * unpackTime) / jsonUnpack)) + '% of json)'
        );
        console.log();

        benchmarkType(++typeNum % TYPE_CBS.length);
    };
    unpack(unpackCB);
};

benchmarkType(0);
