array-indexofobject
===================

Like Array#indexOf but for objects used like hashes

## Examples:

```js
    var arr = [];
    var obj = { a: 1, b: 2, c: 'a b c'};
    var obj2 = { a: 1, b: 2, c: 'a b c'}; // same key/value pairs
    arr.push(obj);
    arr.indexOf(obj); // 0
    arr.indexOf(obj2); // -1
    indexOfObject = require('array-indexofobject');
    indexOfObject(arr, obj); // 0
    indexOfObject(arr, obj2); // 0
```

By default, all properties in the object must match. Optionally, you can instead
pass one or more keys to use for comparison.

```js
    var arr = [];
    var obj = { a: 1, b: 2, c: 'a b c', d: 'something'};
    var obj2 = { a: 1, b: 2, c: 'a b c', d: 'this key is not important'};
    arr.push(obj);
    indexOfObject(arr, obj2); // -1
    indexOfObject(arr, obj2, 'a'); // 0
    indexOfObject(arr, obj2, ['a', 'b', 'c']); // 0
```