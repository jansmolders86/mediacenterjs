
/**
 * Example that executes a Spotify "Search" and parses the XML results using
 * node-xml2js.
 */

var xml2js = require('xml2js');
var Spotify = require('../');
var login = require('../login');
var superagent = require('superagent');
var query = process.argv[2] || 'guitar gently weeps';

Spotify.login(login.username, login.password, function (err, spotify) {
  if (err) throw err;

  spotify.search(query, function (err, xml) {
    if (err) throw err;
    spotify.disconnect();

    var parser = new xml2js.Parser();
    parser.on('end', function (data) {
      console.log(JSON.stringify(data, null, 2));
    });
    parser.parseString(xml);
  });
});
