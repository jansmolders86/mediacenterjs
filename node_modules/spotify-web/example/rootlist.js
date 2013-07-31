
/**
 * Gets the user's "rootlist" (array of playlist IDs).
 */

var Spotify = require('../');
var login = require('../login');

// initiate the Spotify session
Spotify.login(login.username, login.password, function (err, spotify) {
  if (err) throw err;

  // get the currently logged in user's rootlist (playlist names)
  spotify.rootlist(function (err, rootlist) {
    if (err) throw err;

    console.log(rootlist.contents);

    spotify.disconnect();
  });
});
