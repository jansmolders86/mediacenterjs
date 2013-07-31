0.1.3 / 2013-06-16
==================

 - proto: change contentType to bytes format
 - spotify: support MercuryMultiGetRequest in `get()` function
 - util: fix comment
 - spotify: fix lint

0.1.2 / 2013-05-18
==================

 - spotify: use AP resolver to connect to websocket server (GH-13) @adammw

0.1.1 / 2013-03-22
==================

 - error: add error code for non-premium accounts

0.1.0 / 2013-03-09
==================

 - spotify: implement real error handling
 - spotify: ignore "login_complete" message commands
 - spotify: throw an error on unhandled "message" commands
 - error: add SpotifyError class
 - spotify: make rootlist() user default to yourself
 - track: send the User-Agent in .play()
 - Added `rootlist()` function to get a user's stored playlists

0.0.2 / 2013-02-07
==================

 - Fix CSRF token retrieval
 - A whole lot of API changes... too much to list...

0.0.1 / 2013-01-12
==================

 - Initial release:
   - getting Artist/Album/Track metadata works
   - getting MP3 playback URL for a Track works
