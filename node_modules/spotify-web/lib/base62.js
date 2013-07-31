
/**
 * From Spotify Web client code.
 * See: https://gist.github.com/4463921#file-spotify-web-client-js-L3503-L3546
 */

module.exports = function () {
  function g(a, b, c) {
    for (var d = [0], f = [1], g = 0; g < a.length; ++g) {
      for (var k = d, p = f, q = a[g], s = c, t = 0, y = 0; y < p.length; ++y) t = ~~k[y] + p[y] * q + t, k[y] = t % s, t = ~~ (t / s);
      for (; t;) t = ~~k[y] + t, k[y] = t % s, t = ~~ (t / s), ++y;
      k = f;
      p = b;
      q = c;
      for (s = y = 0; s < k.length; ++s) y = k[s] * p + y, k[s] = y % q, y = ~~ (y / q);
      for (; y;) k.push(y % q), y = ~~ (y / q)
    }
    return d
  }
  function f(a, b) {
    for (var c = 0, d = []; c < a.length; ++c) d.push(b[a[c]]);
    return d.reverse()
  }
  function d(a, b) {
    for (; a.length < b;) a.push(0);
    return a
  }
  for (var b = {}, c = {}, a = 0; a < 62; ++a) c["0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" [a]] = a;
  for (a = 0; a < 16; ++a) b["0123456789abcdef" [a]] = a;
  for (a = 0; a < 16; ++a) b["0123456789ABCDEF" [a]] = a;
  return {
    fromBytes: function (a, b) {
                 var c = g(a.slice(0).reverse(), 256, 62);
                 return f(d(c, b), "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ").join("")
               },
      toBytes: function (a, b) {
                 var l = g(f(a, c), 62, 256);
                 return d(l, b).reverse()
               },
      toHex: function (a, b) {
               var l = g(f(a, c), 62, 16);
               return f(d(l, b), "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ").join("")
             },
      fromHex: function (a, c) {
                 var l = g(f(a, b), 16, 62);
                 return f(d(l,
                       c), "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ").join("")
               }
  }
}();
