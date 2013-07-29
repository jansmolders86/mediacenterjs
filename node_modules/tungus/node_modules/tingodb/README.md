TingoDB
=======

Embedded JavaScript in-process file system backed database upward compatible on API level with MongoDB.

Upward compatible means that if you build app that uses functionality implemented by TingoDB you can switch to MongoDB almost without code changes. This greatly reduces implementation risks and give you freedom to switch to mature solution at any moment.

As a proof for upward compatibility all tests designed to run against both MongoDB and TingoDB.
More over significant part of tests contributed from MongoDB nodejs driver project and used as is without modifications.

For those folks who familiar with Mongoose.js ODM we suggest to look at [Tungus](https://github.com/sergeyksv/tungus), experimental driver that allows to use famous ODM tool with our database.



For more details please visit http://www.tingodb.com

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/sergeyksv/tingodb/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
[![Build Status](https://travis-ci.org/sergeyksv/tingodb.png?branch=master)](https://travis-ci.org/sergeyksv/tingodb)

Usage
======

	npm install tingodb

As it stated API is fully compatible with MongoDB. Difference is only initialization and obtaining of Db object. Consider this MongoDB code:

	var Db = require('mongodb').Db,
		Server = require('mongodb').Server,
		assert = require('assert');

	var db = new Db('test', new Server('locahost', 27017));
	var collection = db.collection("batch_document_insert_collection_safe");
	collection.insert([{hello:'world_safe1'}
	  , {hello:'world_safe2'}], {w:1}, function(err, result) {
	  assert.equal(null, err);

	  collection.findOne({hello:'world_safe2'}, function(err, item) {
		assert.equal(null, err);
		assert.equal('world_safe2', item.hello);
	  })
	});

The same example using TingoDB will be following:

	var Db = require('tingodb')().Db,
		assert = require('assert');

	var db = new Db('/some/local/path', {});
	// Fetch a collection to insert document into
	var collection = db.collection("batch_document_insert_collection_safe");
	// Insert a single document
	collection.insert([{hello:'world_safe1'}
	  , {hello:'world_safe2'}], {w:1}, function(err, result) {
	  assert.equal(null, err);

	  // Fetch the document
	  collection.findOne({hello:'world_safe2'}, function(err, item) {
		assert.equal(null, err);
		assert.equal('world_safe2', item.hello);
	  })
	});

So, as you can see difference is in require call and database object initialization. 

#### require('tingodb')(options)

In contrast to MongoDB, module require call will not return usable module. It will return a function that accept configuration options. This function will return something similar to MongoDB module. Extra step allows to inject some options that will control database behavior.

##### nativeObjectID: true|false Default is false

Doing some experimentation we found that using integer keys we can get database work faster and save some space. Additionally for in-process database there are almost no any drawbacks versus globally unique keys. However in the same time it is relatively hard to keep unique integer keys outside of the database engine. So we make it part of the database engine code. Generated keys will be unique in collection scope. 

When required it is possible to switch to BSON ObjectID using the configuration option.

##### cacheSize: integer Default is 1000

Maximum number of cached objects per collection.

##### cacheMaxObjSize: integer Default is 1024 bytes

Maximum size of object that can be placed to cache.

##### searchInArray: true|false Default is false

Globally enables support of search in nested array. MongoDB support this unconditionally. For TingoDB search in arrays when there are no arrays is performance penalty. That's why it is switched off by default. 
Additionally, and it might be better approach, nested arrays support can be enabled for individual indexes or search queries.

To enable nested arrays in individual index use "_tiarr:true" option.
 
	self._cash_transactions.ensureIndex("splits.accountId",{_tiarr:true},cb); 
 
To enable nested arrays in individual query for fields that do not use indexes use "_tiarr." prefixed field names.
 
	coll.find({'arr.num':10},{"_tiar.arr.num":0}) 

####  new Db(path, options)

The only required parameter is database path. It should be valid path to empty folder or folder that already contain collection files.

Dual usage
=========

It is possible to build application that will transparently support both MongoDB and TingoDB. Here are some hints that help to do it:

* Wrap module require call into helper module or make it part of core object. This way you can control which engine is loaded in single place.
* Use only native JavaScript types. BSON types can be slow in JavaScript and will need special attention when passed to or from client JavaScript.
* Think about ObjectID as of just unique value that can be converted to and from String regardless its actual meaning.

Please take a look to sample that consists from 3 files.

###### engine.js - wrapper on TingoDB and MongoDB

	
	var fs = require('fs'),db,engine;

	// load config
	var cfg = JSON.parse(fs.readFileSync("./config.json"));

	// load requestd engine and define engine agnostic getDB function
	if (cfg.app.engine=="mongodb") {
		engine = require("mongodb");
		module.exports.getDB = function () {
			if (!db) db = new engine.Db(cfg.mongo.db,
				new engine.Server(cfg.mongo.host, cfg.mongo.port, cfg.mongo.opts),
					{native_parser: false, safe:true});
			return db;
		}
	} else {
		engine = require("tingodb")({});
		module.exports.getDB = function () {
			if (!db) db = new engine.Db(cfg.tingo.path, {});
			return db;
		}
	}
	// Depending on engine this can be different class
	module.exports.ObjectID = engine.ObjectID;

###### sample.js - Dummy usage example, pay attention to comments

	
	var engine = require('./engine');
	var db = engine.getDB();

	console.time("sample")
	db.open(function(err,db) {
		db.collection("homes", function (err, homes) {
			// its fine to create ObjectID in advance
			// NOTE!!! we get class thru engine because its type
			// can depends on database type
			var homeId = new engine.ObjectID();
			// but with TingoDB.ObjectID righ here it will be negative
			// which means temporary. However its uniq and can be used for 
			// comparisons
			console.log(homeId);
			homes.insert({_id:homeId, name:"test"}, function (err, home) {
				var home = home[0];
				// in this place homeID will change its value and will be in sync
				// with database
				console.log(homeId,home);
				db.collection("rooms", function (err, rooms) {
					for (var i=0; i<5; i++) {
						// its ok also to not provide id, then it will be
						// generated
						rooms.insert({name:"room_"+i,_idHome:homeId}, function (err, room) {
							console.log(room[0]);
							i--;
							if (i==0) {
								// now lets assume we serving request like
								// /rooms?homeid=_some_string_
								var query = "/rooms?homeid="+homeId.toString();
								// dirty code to get simulated GET variable
								var getId = query.match("homeid=(.*)")[1];
								console.log(query, getId)
								// typical code to get id from external world
								// and use it for queries
								rooms.find({_idHome:new engine.ObjectID(getId)})
									.count(function (err, count) {
										console.log(count);
										console.timeEnd("sample");
								})
							}
						})
					}
				})
			})
		})
	})

###### config.json - Dummy config

	
	{
		"app":{
			"engine":"tingodb"
		},
		"mongo":{
			"host":"127.0.0.1",
			"port":27017,
			"db":"data",
			"opts":{
				"auto_reconnect": true,
				"safe": true
			}
		},
		"tingo":{
			"path":"./data"
		}
	}

###### Console output running on TingoDB

	
	-2
	13 { _id: 13, name: 'test' }
	{ name: 'room_0', _idHome: 13, _id: 57 }
	{ name: 'room_1', _idHome: 13, _id: 58 }
	{ name: 'room_2', _idHome: 13, _id: 59 }
	{ name: 'room_3', _idHome: 13, _id: 60 }
	{ name: 'room_4', _idHome: 13, _id: 61 }
	/rooms?homeid=13 13
	5
	sample: 27ms

###### Console output running on MongoDB

	51b43a05f092a1c544000001
	51b43a05f092a1c544000001 { _id: 51b43a05f092a1c544000001, name: 'test' }
	{ name: 'room_3',
	  _idHome: 51b43a05f092a1c544000001,
	  _id: 51b43a05f092a1c544000005 }
	{ name: 'room_2',
	  _idHome: 51b43a05f092a1c544000001,
	  _id: 51b43a05f092a1c544000004 }
	{ name: 'room_1',
	  _idHome: 51b43a05f092a1c544000001,
	  _id: 51b43a05f092a1c544000003 }
	{ name: 'room_0',
	  _idHome: 51b43a05f092a1c544000001,
	  _id: 51b43a05f092a1c544000002 }
	{ name: 'room_4',
	  _idHome: 51b43a05f092a1c544000001,
	  _id: 51b43a05f092a1c544000006 }
	/rooms?homeid=51b43a05f092a1c544000001 51b43a05f092a1c544000001
	5
	sample: 22ms
	
Compatibility
=========
We maintain full API and functionality compatibility with MongoDB **BUT** only for what we implemented support. I.e. if we support something it will work exactly the same, but something is not yet supported or support is limited. 

- Search, almost all clauses. Indexes are used to increase search speed and sorting.
- Map reduce, almost all
- Grouping, almost all
- Collection, almost all methods
- Cursor, almost all methods
- Indexes, no support for compaund indxes, only single field indexes are supported. Full text search is also not supprted
- GridFS, no support
- Feature X, now know, might be :)


## MIT License

Copyright (c) [PushOk Software](http://www.pushok.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/43ade4aa68ffeff6305805e22bcf676a "githalytics.com")](http://githalytics.com/sergeyksv/tingodb)
