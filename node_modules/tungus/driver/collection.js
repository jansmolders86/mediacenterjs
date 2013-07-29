var Collection = require('./tingodb').Collection;

function TingoCollection (name, conn, opts) {
  if (undefined === opts) opts = {};
  if (undefined === opts.capped) opts.capped = {};

  opts.bufferCommands = undefined === opts.bufferCommands
    ? true
    : opts.bufferCommands;

  if ('number' == typeof opts.capped) {
    opts.capped = { size: opts.capped };
  }

  this.opts = opts;
  this.name = name;
  this.conn = conn;
  
  this.queue = [];
  this.buffer = this.opts.bufferCommands;  
  
  if (conn.db) 
	this.onOpen();
};

TingoCollection.prototype.addQueue = function (name, args) {
  this.queue.push([name, args]);
  return this;
};

TingoCollection.prototype.doQueue = function () {
  for (var i = 0, l = this.queue.length; i < l; i++){
    this[this.queue[i][0]].apply(this, this.queue[i][1]);
  }
  this.queue = [];
  return this;
};

TingoCollection.prototype.onOpen = function () {
  var self = this;

  // always get a new collection in case the user changed host:port
  // of parent db instance when re-opening the connection.

  if (!self.opts.capped.size) {
    // non-capped
    return self.conn.db.collection(self.name, callback);
  }

  // capped
  return self.conn.db.collection(self.name, function (err, c) {
    if (err) return callback(err);

    // discover if this collection exists and if it is capped
    c.options(function (err, exists) {
      if (err) return callback(err);

      if (exists) {
        if (exists.capped) {
          callback(null, c);
        } else {
          var msg = 'A non-capped collection exists with the name: '+ self.name +'\n\n'
                  + ' To use this collection as a capped collection, please '
                  + 'first convert it.\n'
                  + ' http://www.mongodb.org/display/DOCS/Capped+Collections#CappedCollections-Convertingacollectiontocapped'
          err = new Error(msg);
          callback(err);
        }
      } else {
        // create
        var opts = utils.clone(self.opts.capped);
        opts.capped = true;
        self.conn.db.createCollection(self.name, opts, callback);
      }
    });
  });

  function callback (err, collection) {
    if (err) {
      // likely a strict mode error
      self.conn.emit('error', err);
    } else {
      self.collection = collection;
	  self.buffer = false;
	  self.doQueue();      
    }
  };
};

/*!
 * Copy the collection methods and make them subject to queues
 */

for (var i in Collection.prototype) {
  // skip private methods
  if (i.indexOf("_")==0) continue;
  (function(i){
    TingoCollection.prototype[i] = function () {
      if (this.buffer) {
        this.addQueue(i, arguments);
        return;
      }

      var collection = this.collection
        , args = arguments;

      collection[i].apply(collection, args);
    };
  })(i);
}

/**
 * Retreives information about this collections indexes.
 *
 * @param {Function} callback
 * @method getIndexes
 * @api public
 */

TingoCollection.prototype.getIndexes = Collection.prototype.indexInformation;

/*!
 * Module exports.
 */

module.exports = TingoCollection;
