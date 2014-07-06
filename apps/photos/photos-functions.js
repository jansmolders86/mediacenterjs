var fs = require('fs');
var glob = require('glob');
var path = require('path');
var config = require('../../lib/handlers/configuration-handler').getConfiguration();

var validFileExtensions = /\.(jpg|jpeg|gif|png)/gi;
var photos = [];

// TODO: Needs heavy refactoring!

module.exports.loadItems = function (req, res) {
  var dir = config.photospath;
  if (req.query.path) {
    dir = req.query.path;
  }

  fs.readdir(dir, function (err, contents) {
    if (err) console.log(err);

    if (!contents || contents.length <= 0) {
      return res.json(200, []);
    }

    photos = [];
    contents.forEach(function (file) {
      if (file.indexOf('.') == 0) { return; }
      var stat = fs.statSync(path.join(dir, file));
      if (stat.isFile() && !file.match(validFileExtensions)) { return; }

      var photo = {
        filepath: path.join(dir, file),
        filename: file,
        src: !stat.isDirectory() ? '/photos/show/' + file + '?path=' + file : '',
        dateShot: Date.now(),
        isAlbum: stat.isDirectory()
      };

      if (photo.isAlbum) {
        var files = fs.readdirSync(path.join(dir, file));
        if (files && files.length > 0) {
          files = files.filter(function (item) { return item.match(validFileExtensions); });
          if (files.length > 4) {
            files = files.slice(0, 4);
          }

          photo.original_filepath = dir;
          photo.thumbnails = files.map(function (thumbnail) {
            return '/photos/show/' + file + '?path=' + path.join(file, thumbnail);
          });
        }
      }

      photos.push(photo);
    });

    return res.json(200, photos);
  });
};

module.exports.show = function (req, res) {
  var photoToShow = photos.filter(function (photo) {
    if (photo.isAlbum) {
      var results = photo.thumbnails.filter(function (thumb) { return thumb.indexOf(req.query.path) >= 0; });
      return results && results.length > 0;
    }

    return photo.filepath.indexOf(req.query.path) >= 0;
  });

  var photo = photoToShow[0];

  if (photo.isAlbum) {
    var thumbnailPath = path.join(photo.original_filepath, req.query.path);
    return res.send(200, fs.readFileSync(thumbnailPath));
  }

  return res.send(200, fs.readFileSync(photo.filepath));
};
