var LastfmAPI = require('lastfmapi')
, mm = require('musicmetadata')
, fs = require('fs-extra')
, logger = require('winston');

exports.valid_filetypes = /(m4a|mp3)$/gi;

exports.processFile = function (fileObject, callback) {
    var parser = new mm(fs.createReadStream(fileObject.href));
    var result = null;

    parser.on('metadata', function(metadata) {
        result = metadata;
    });
    parser.on('done', function(err) {
        if (err) {
            logger.error('Music parse error', { error: err });
        } else {
            var trackName = 'Unknown Title'
            ,   trackNo = ''
            ,   albumName = 'Unknown Album'
            ,   genre = 'Unknown'
            ,   artistName = 'Unknown Artist'
            ,   year = '';

            if (result) {
                trackName = (result.title)        ? result.title.replace(/\\/g, '') : trackName;
                trackNo   = (result.track.no)     ? result.track.no : trackNo;
                albumName = (result.album)        ? result.album.replace(/\\/g, '') : albumName;
                artistName= (result.artist[0])    ? result.artist[0].replace(/\\/g, '') : artistName;
                year      = (result.year)         ? new Date(result.year).getFullYear() : year;

                // TODO: Genre not used anywhere??
                var genrelist = result.genre;
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

                Artist.findOrCreate(artistData, artistData)
                .then(function (artist) {
                    albumData.ArtistId = artist.id;
                    return Album.findOrCreate({ title: albumData.title }, albumData);
                })
                .then(function (album) {
                    trackData.AlbumId = album.id;
                    return Track.findOrCreate({ title: trackData.title }, trackData);
                })
                .then(function (track) {
                    callback();
                });
            });
        }
    });
}
