module.exports = {
	getInfo: function (req, res, infoRequest){	
		Spotify.search({ type: 'track', query: infoRequest }, function(err, data) {
			if ( err ) {
				console.log('Error occurred: ' + err);
				return;
			} else {
				res.send(data);
			}
		});
	},
	playTrack: function(res,req,infoRequest){
		spotifyPlay.login(username, password, function (err, result) {
			if (err) {
				console.log('Spotify error',err);
			} else {
				result.get(infoRequest, function (err, track) {
					console.log('Playing: %s - %s', track.artist[0].name, track.name);
					track.play()
						.pipe(new lame.Decoder())
						.pipe(new Speaker())
						.on('finish', function () {
							result.disconnect();
						});
				});
			}
		});
	},
	getAlbum: function(req, res, infoRequest){
		var uri = req.params.album
		, username = config.spotifyUser
		, password = config.spotifyPass;

		spotifyPlay.login(username, password, function (err, result) {
			if (err) {
				console.log('Spotify error',err);
			} else {
				console.log('Album Art URIs for "%s - %s"', album.artist[0].name, album.name);

				album.cover.forEach(function (image) {
					console.log('%s: %s', image.size, image.uri);
				});
			}
		});
	}
}
