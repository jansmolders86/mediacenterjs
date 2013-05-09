(function() {
  var exports, querystring, request, zlib,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  querystring = require('querystring');

  request = require('request');

  zlib = require('zlib');

  exports = module.exports = function(format) {
    var discogsRequest, getUrl, responseHandler;
    getUrl = function(url) {
      var sep;
      sep = __indexOf.call(url, "?") >= 0 ? "&" : "?";
      if (url.substr(0, 7) !== 'http://') url = "http://api.discogs.com/" + url;
      if (format) url += "" + sep + "f=" + format;
      return url;
    };
    discogsRequest = function(url, next) {
      var parseResponse;
      parseResponse = function(err, res, body) {
        var _ref;
        if (err) return next(err);
        if (~((_ref = res.headers['content-type']) != null ? _ref.indexOf('json') : void 0) || !format) {
          try {
            body = JSON.parse(body);
          } catch (e) {
            err = e;
            body = null;
          }
          return next(err, body);
        }
      };
      return request({
        uri: getUrl(url),
        headers: {
          'accept-encoding': 'gzip'
        },
        encoding: null
      }, function(error, res, body) {
        var _ref, _ref2;
        if (!error && (200 <= (_ref = res.statusCode) && _ref < 400)) {
          if (~((_ref2 = res.headers['content-encoding']) != null ? _ref2.indexOf('gzip') : void 0)) {
            return zlib.gunzip(body, function(err, body) {
              return parseResponse(err, res, body);
            });
          } else {
            return parseResponse(error, res, body);
          }
        } else {
          return next(error);
        }
      });
    };
    responseHandler = function(type, next) {
      return function(err, res) {
        if (err || !(res instanceof Object) || !(type in (res != null ? res.resp : void 0))) {
          return next(err, res);
        }
        return next(null, res.resp[type]);
      };
    };
    return {
      get: function(url, next) {
        return discogsRequest(url, next);
      },
      master: function(id, next) {
        return discogsRequest('master/' + id, responseHandler('master', next));
      },
      release: function(id, next) {
        return discogsRequest('release/' + id, responseHandler('release', next));
      },
      artist: function(name, next) {
        return discogsRequest('artist/' + name, responseHandler('artist', next));
      },
      label: function(name, next) {
        return discogsRequest('label/' + name, responseHandler('label', next));
      },
      search: function(query, type, next) {
        if (type instanceof Function) {
          next = type;
          type = 'all';
        }
        return discogsRequest('search?' + querystring.stringify({
          type: type,
          q: query
        }), responseHandler('search', next));
      },
      lookup: function(query, next) {
        var _this = this;
        return this.search(query, "releases", function(err, res) {
          var id, masters, matches, release, result, results, _ref;
          if (err) return next(err);
          results = res != null ? (_ref = res.searchresults) != null ? _ref.results : void 0 : void 0;
          if (!results) return next();
          masters = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = results.length; _i < _len; _i++) {
              result = results[_i];
              if (result.type === "master") _results.push(result);
            }
            return _results;
          })();
          if (masters.length) results = masters;
          matches = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = results.length; _i < _len; _i++) {
              result = results[_i];
              if (result.title.toLowerCase() === query.toLowerCase()) {
                _results.push(result);
              }
            }
            return _results;
          })();
          if (matches.length) results = matches;
          release = results[0];
          id = release.uri.split("/").pop();
          return _this[release.type](id, function(err, res) {
            if ("master_id" in res) {
              return _this.master(res.master_id, function(err, master) {
                if ("main_release" in master) {
                  return _this.release(master.main_release, next);
                } else {
                  return next(null, master);
                }
              });
            } else if ("main_release" in res) {
              return _this.release(res.main_release, next);
            } else {
              return next(null, res);
            }
          });
        });
      }
    };
  };

}).call(this);
