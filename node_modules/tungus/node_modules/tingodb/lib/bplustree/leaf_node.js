var InternalNode = require('./internal_node');

var LeafNode = module.exports = function(order) {
  this.order = order;
  this.isLeafNode = true;
  this.isInternalNode = false;

  this.parentNode = null;
  this.nextNode = null;
  this.prevNode = null;

  this.data = [];
  
};

LeafNode.prototype.split = function() {
  var tmp = new LeafNode(this.order);
  var m = Math.ceil(this.data.length / 2);
  var k = this.data[m-1].key;

  // Copy & shift data
  for(var i=0; i<m; i++){
    tmp.data[i] = this.data.shift();
  }
  tmp.parentNode = this.parentNode;
  tmp.nextNode = this;
  tmp.prevNode = this.prevNode;
  if(tmp.prevNode) tmp.prevNode.nextNode = tmp;
  this.prevNode = tmp;

  if(!this.parentNode){
    var p = new InternalNode(this.order);
    this.parentNode = tmp.parentNode = p;
  }

  return this.parentNode.insert(k, tmp, this);
};

LeafNode.prototype.insert = function(key, value) {
  var pos = 0;
  for(; pos<this.data.length; pos++){
    if(this.data[pos].key == key) {
      this.data[pos].value = value;
      return null;
    }
    if(this.data[pos].key > key) break;
  }

  if (this.data[pos]) {
    this.data.splice(pos, 0, {"key": key, "value": value});
  } else {
    this.data.push({"key": key, "value": value});
  }

  // Split
  if(this.data.length > this.order) {
    return this.split();
  }
  
  return null;
};