[![build status](https://secure.travis-ci.org/theycallmeswift/grooveshark.png)](http://travis-ci.org/theycallmeswift/grooveshark)

# Grooveshark

This is a package for interacting with the [Grooveshark V3 API](http://developers.grooveshark.com/docs/public_api/v3/) using node.js.

## Installation

    npm install grooveshark

## Usage

    var gs = require('grooveshark')
      , client = new gs('your_api_key', 'your_api_secret');

    client.authenticate('your_grooveshark_username', 'you_grooveshark_password', function(err) {
      client.request('someMethod', {param1: 'foobar', param2: 1234}, function(err, status, body) {
        if(err) {
          throw err
        }

        console.log(body);
      });
    })
