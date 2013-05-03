(function() {
  Grooveshark = require('../')
  nock = require('nock');

  jasmine.Matchers.prototype.toBeFunction = function() {
    return typeof this.actual === 'function'
  }
})();
