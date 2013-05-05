GoogleMusicAPI.NodeJS an unofficial API for Google Play Music
=====================
GOOGLE MUSIC API

allows control of
`Google Music <http://music.google.com>` with NodeJS.

**Requires:** 
- GoogleClientLogin
- restler

```javascript
	var googlemusic = new GoogleMusic('user@gmail.com', 'password');
	googlemusic.Login(function () {
		googlemusic.GetAllSongs('', function(result) {
			var length = result.length;
			var i;
			for (i=0 ; i<length ; i++) {
				console.log(result[i].title); // get title of all songs
			}
		});
		googlemusic.GetPlaylist('All', function(result) {
			var length = result.length;
			var i;
			for (i=0 ; i<length ; i++) {
				console.log(result[i].playListId); // get id of all playlists
			}
		});
	});
```

## Methods: 
+ GetStatus 
	> get basic inforamtion( total tracks, total albums, personolized ads :) )
+ GetAllSongs 
	> get all songs for Google Play, google play could respond with chunks, to receive with chunks get songs with continuationToken
+ GetPlaylist
	> get playlist by id, or use "All" for getting all playlists
+ GetSongURL
	> get song url, pass song id to this function
+ DeletePlaylist
	> delete playlist, pass playlist id to this function
+ GetNewAndRecent
	> get new and recent albums
+ GetMixEntries 
	> get mixed playlists