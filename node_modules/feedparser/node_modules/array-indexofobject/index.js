/**
 * Like Array#indexOf but for objects used like hashes
 *
 * Example:
 *    var arr = [];
 *    var obj = { a: 1, b: 2, c: 'a b c'};
 *    var obj2 = { a: 1, b: 2, c: 'a b c'}; // same key/value pairs
 *    arr.push(obj);
 *    arr.indexOf(obj); // 0
 *    arr.indexOf(obj2); // -1
 *    indexOfObject = require('array-indexofobject');
 *    indexOfObject(arr, obj); // 0
 *    indexOfObject(arr, obj2); // 0
 *
 * @param {Array}
 * @param {Object}
 * @param {Sting|Array} (optional)
 * @return {Number}
 */
module.exports = function indexOfObject (array, object, keys) {
  if (!keys) {
    keys = Object.keys(object);
  }
  if (!Array.isArray(keys)) {
    keys = [keys];
  }

  var i = 0, len = array.length;
  for (; i < len; i++) {
    if (keys.every(matches.bind(null, array[i], object))) {
      return i;
    }
  }
  return -1;
};

function matches (item, object, key) {
  return has(item, key) && has(object, key) && item[key] === object[key];
}

/**
 * Safe hasOwnProperty
 * See: http://www.devthought.com/2012/01/18/an-object-is-not-a-hash/
 */
function has (obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
