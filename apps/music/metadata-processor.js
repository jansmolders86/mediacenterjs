var LastfmAPI = require('lastfmapi')
, mm = require('music-metadata')
, fs = require('fs-extra')
, logger = require('winston');

exports.valid_filetypes = /(m4a|mp2|mp3|mp4|flac|wma|asf|ogg|opus|wv|wav)$/gi;

exports.processFile = function(fileObject, callback) {
	logger.info(`Parsing ${fileObject.href}`);
    mm.parseStream(fs.createReadStream(fileObject.href, {skipPostHeaders: true})).then(function(metadata) {

    	var common = metadata.common;

    	var trackName = 'Unknown Title'
			,   trackNo = ''
			,   albumName = 'Unknown Album'
			,   genre = 'Unknown'
			,   artistName = 'Unknown Artist'
			,   year = '';

		if (common) {
			trackName = (common.title)        ? common.title.replace(/\\/g, '') : trackName;
			trackNo   = (common.track.no)     ? common.track.no : trackNo;
			albumName = (common.album)        ? common.album.replace(/\\/g, '') : albumName;
			artistName= (common.artist)       ? common.artist.replace(/\\/g, '') : artistName;
			year      = (common.year)         ? new Date(common.year).getFullYear() : year;

			// TODO: Genre not used anywhere??
			var genrelist = common.genre;
			if (genrelist && genrelist.length > 0) {
				genre = genrelist[0];
			}
		}

		var lastfm = new LastfmAPI({
			'api_key'   : '36de4274f335c37e12395286ec6e92c4',
			'secret'    : '1f74849490f1872c71d91530e82428e9'
		});

		lastfm.album.getInfo({ artist: artistName, album: albumName }, function (err, album) {
			if (err) {
				logger.error(err);
				callback();
			}

			// TODO: Maybe also use releasedate here if not already available from musicmetadata?
			var cover = '/music/css/img/nodata.jpg';
			if (album && album.image[3] && album.image[3]['#text']) {
				cover = album.image[3]['#text']; // Image at Index 3 = Large Album Cover
			}

			var albumData = {
				title: albumName,
				posterURL: cover,
				year: year
			};
			var artistData = {
				name: artistName
			};
			var trackData = {
				title: trackName,
				order: trackNo,
				filePath: fileObject.href
			};

			Artist.findOrCreate({where: artistData, defaults: artistData})
				.spread(function (artist, created) {
					albumData.ArtistId = artist.id;
					return Album.findOrCreate({where: { title: albumData.title }, defaults: albumData});
				})
				.spread(function (album, created) {
					trackData.AlbumId = album.id;
					return Track.findOrCreate({where: { title: trackData.title }, defaults: trackData});
				})
				.spread(function (track, created) {
					callback();
				});
		});

	}).catch(function(err) {
		logger.error('Music parse error', { error: err });
		callback();
	})
}
