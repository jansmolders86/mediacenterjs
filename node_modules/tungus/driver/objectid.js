var ObjectId = require('./tingodb').ObjectID;

var ObjectIdToString = ObjectId.toString.bind(ObjectId);
module.exports = exports = ObjectId;

ObjectId.fromString = function(str){
  return new ObjectId(str);
};

ObjectId.toString = function(oid){
  if (!arguments.length) return ObjectIdToString();
  return oid.toJSON();
};

module.exports = exports = ObjectId;

