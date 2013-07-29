var InternalNode = module.exports = function(order) {
  this.order = order;
  this.isLeafNode = false;
  this.isInternalNode = true;

  this.parentNode = null;

  this.data = [];
};

InternalNode.prototype.split = function() {
  var time = Date.now();
  var m = null;
  if(this.order % 2){
    var m = (this.data.length-1)/2 - 1;
  }else{
    var m = (this.data.length-1)/2;
  }

  var tmp = new InternalNode(this.order);
  tmp.parentNode = this.parentNode;
  for(var i=0; i<m; i++){
    tmp.data[i] = this.data.shift();
  }
  for(var i=0; i<tmp.data.length; i+=2){
    tmp.data[i].parentNode = tmp;
  }
  var key = this.data.shift();

  if(!this.parentNode){
    this.parentNode = tmp.parentNode = new InternalNode(this.order);
  }

  return this.parentNode.insert(key, tmp, this);
};

InternalNode.prototype.insert = function(key, node1, node2) {
  if(this.data.length){
    var pos = 1;
    for(; pos < this.data.length; pos+=2){
      if(this.data[pos] > key) break;
    }

    if(pos<this.data.length) {
      pos--;
      this.data.splice(pos, 0, key);
      this.data.splice(pos, 0, node1);
    }else{
      this.data[pos-1] = node1;
      this.data.push(key);
      this.data.push(node2);
    }

    if(this.data.length > (this.order*2+1)){
      return this.split();
    }
    return null;
  }else{
    this.data[0] = node1;
    this.data[1] = key;
    this.data[2] = node2;
    return this;
  }
};
