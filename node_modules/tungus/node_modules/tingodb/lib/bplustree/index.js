var LeafNode     = require('./leaf_node'),
    InternalNode = require('./internal_node');

var default_options = {
  order: 100 // Min 1
};

var BPlusTree = module.exports = function(options) {
  this.options = options || default_options;
  if (!this.options.order) {
    this.options.order = default_options.order;
  }
  this.root = new LeafNode(this.options.order);
};


BPlusTree.prototype.set = function(key, value) {
  var node = this._search(key);
  var ret = node.insert(key, value);
  if (ret) {
    this.root = ret;
  }
};

BPlusTree.prototype.get = function(key) {
  var node = this._search(key);
  for(var i=0; i<node.data.length; i++){
    if(node.data[i].key == key) return node.data[i].value;
  }
  return null;
};

BPlusTree.prototype.del = function(key) {
  var node = this._search(key);
  for(var i=0; i<node.data.length; i++){
    if(node.data[i].key == key) {
		node.data.splice(i,1)
		// TODO, NOTE SURE IF THIS IS ENOUGH
		break;
	}
  }
  return null;
};

BPlusTree.prototype.getNode = function(key) {
  return this._search(key);
};

BPlusTree.prototype._search = function(key) {
  var current = this.root;
  var found = false;
  
  while(current.isInternalNode){
    found = false;
    var len = current.data.length;
    for(var i=1; i<len; i+=2){
      if( key <= current.data[i]) {
        current = current.data[i-1];
        found = true;
        break;
      }
    }

    // Follow infinity pointer
    if(!found) current = current.data[len - 1];
  }
  
  return current;
};

// walk the tree in order
BPlusTree.prototype.each = function(callback, node) {
  if (!node) {
    node = this.root;
  }
  var current = node;
  if(current.isLeafNode){
    for(var i = 0; i < current.data.length; i++) {
      var node = current.data[i];
      if (node.value) {
        callback(node.key, node.value);
      }
    }
  } else {
    for(var i=0; i<node.data.length; i+=2) {
      this.each(callback, node.data[i]);
    }
  }
};

// walk the tree in order
BPlusTree.prototype.all = function(node,res) {
  if (!res)
	res = [];
  if (!node) {
    node = this.root;
  }
  var current = node;
  if(current.isLeafNode){
    for(var i = 0; i < current.data.length; i++) {
      var node = current.data[i];
      res.push(node.value)
    }
  } else {
    for(var i=0; i<node.data.length; i+=2) {
      this.all(node.data[i],res);
    }
  }
  return res;
};

BPlusTree.prototype.each_reverse = function(callback, node) {
  if (!node) {
    node = this.root;
  }
  var current = node;
  if(current.isLeafNode){
    for(var i = current.data.length - 1; i >= 0 ; i--) {
      var node = current.data[i];
      if (node.value) {
        callback(node.key, node.value);
      }
    }
  } else {
    for(var i=node.data.length - 1; i >= 0; i-=2) {
      this.each(callback, node.data[i]);
    }
  }
};


// Get a range
BPlusTree.prototype.range = function(start, end, callback) {
  var node = this._search(start);
  if (!node) {
    node = this.root;
    while (!node.isLeafNode) {
      node = node[0]; // smallest node
    }
  }
  var ended = false;
  
  while (!ended) {
    for(var i = 0; i < node.data.length; i ++) {
      var data = node.data[i];
      var key = data.key;
      if (end && key > end) {
        ended = true;
        break;
      } else {
        if ((start === undefined || start <= key) && (end === undefined || end >= key) && data.value) {
          callback(key, data.value);
        }
      }
    }
    node = node.nextNode;
    if (!node) {
      ended = true
    }
  }
};

BPlusTree.prototype.rangeSync = function(start, end, exclusive_start, exclusive_end) {
  var values = [];
  var node = this._search(start);
  if (!node) {
    node = this.root;
    while (!node.isLeafNode) {
      node = node[0]; // smallest node
    }
  }
  var ended = false;
  
  function keyCheck(key) {
        return (start === undefined
            || start === null
            || !exclusive_start && start <= key
            || exclusive_start && start < key
          ) && (
               end === undefined
            || end === null
            || !exclusive_end && end >= key
            || exclusive_end && end > key
          ) 
	}
  
  while (!ended) {
	if (values.length && node.data.length>0 && keyCheck(node.data[0].key,node.data[0].value) &&
		keyCheck(node.data[node.data.length-1].key,node.data[node.data.length-1].value))
	{
		// entire node is in range
		for(var i = 0; i < node.data.length; i ++) {
			values.push(node.data[i].value);
		}
	} else {
		for(var i = 0; i < node.data.length; i ++) {
		  var data = node.data[i];
		  var key = data.key;
		  if (end && key > end) {
			ended = true;
			break;
		  } else {
			  if (keyCheck(key,data.value))
				values.push(data.value);
		  }
	  }
    }
    node = node.nextNode;
    if (!node) {
      ended = true
    }
  }
  return values;
};

// B+ tree dump routines
BPlusTree.prototype.walk = function(node, level, arr) {
  var current = node;
  if(!arr[level]) arr[level] = [];

  if(current.isLeafNode){
    for(var i=0; i<current.data.length; i++){
      arr[level].push("<"+current.data[i].key+">");
    }
    arr[level].push(" -> ");
  }else{

    for(var i=1; i<node.data.length; i+=2){
      arr[level].push("<"+node.data[i]+">");
    }
    arr[level].push(" -> ");
    for(var i=0; i<node.data.length; i+=2) {
      this.walk(node.data[i], level+1, arr);
    }

  }
  return arr;
};

BPlusTree.prototype.dump = function() {
  var arr = [];
  this.walk(this.root, 0, arr);
  for(var i=0; i<arr.length; i++){
    var s = "";
    for(var j=0; j<arr[i].length; j++){
      s += arr[i][j];
    }
  }
  return s;
};

module.exports.create = function(options) {
  return new BPlusTree(options);
};
