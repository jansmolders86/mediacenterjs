var dbSchema = require('./utils/database-schema');
var fileUtils = require('./utils/file-utils');
var configuration_handler = require('./handlers/configuration-handler');
var config = configuration_handler.initializeConfiguration();
var playback_handler = require('./handlers/playback');
var _ = require('underscore');
var path = require('path');
var io = require('./utils/setup-socket').io;
var logger = require('winston');

var MediaHandler = function(list_object_type, playback_object_type, metadataProcessor, dir) {
  this.list_entity = dbSchema[list_object_type];
  this.playback_entity = dbSchema[playback_object_type];
  this.metadataProcessor = metadataProcessor;
  this.media_dir = path.resolve(config[dir]);
}

MediaHandler.prototype.load = function(findOptions, callback, dontFetchMetadata) {
  var self = this;
  this.list_entity.findAll(findOptions).error(function (err) {
    console.log('Error occurred while loading ' + self.list_entity + ' from DB!', err);
    callback(err);
  }).success(function (result) {
    if (!result || result.length <= 0) {
      if (!dontFetchMetadata) {
        self.fetchMetadata(function() {
          self.load(findOptions, callback, true);
        });
      } else {
        callback();
      }
    } else {
      callback(undefined, result);
    }
  });
}

MediaHandler.prototype.fetchMetadata = function(callback) {
  var self = this;
  fileUtils.getLocalFiles(this.media_dir, self.metadataProcessor.valid_filetypes, function(err, files) {
    if (err) {
      console.log('Error occurred while fetching Metadata for ' + self.media_type, err);
      res.status(500).send();
    }

    var currentFileIndex = 1;
    _.each(files, function(file) {
      self.metadataProcessor.processFile(file, function() {
        // Callback when all Files where processed
        if (currentFileIndex == files.length) {
          callback();
        }

        // Report progress
        currentFileIndex++;
        var percentage = parseInt((currentFileIndex / files.length) * 100, 10);
        io.sockets.emit('progress', { msg: percentage });
      });
    });
  });
}

MediaHandler.prototype.savePlaybackProgress = function (id, progression, callback) {
  var baseMarker = {};
  baseMarker[this.playback_entity + 'Id'] = id;
  var newMarker = marker.merge({ progression: progression, transcodingStatus: 'pending' });

  ProgressionMarker.findOrCreate(baseMarker, newMarker)
    .then(function() {
        callback();
    })
    .catch(function(err) {
        callback(err);
    });
}

MediaHandler.prototype.editMetadata = function (id, newData, callback) {
  this.list_entity.find(id).success(function(object) {
      object.updateAttributes(newData).success(function() {
        callback();
      }).error(function(err) {
        console.log(err);
        callback(err);
      });
  });
}

MediaHandler.prototype.updateMetadata = function (id, newData, callback) {
  var self = this;
  this.list_entity.find(id).success(function(object) {
     object.set(newData);
     fileUtils.getLocalFile(self.media_dir, object.fileName, function(err, fileObject) {
       self.metadataFunc(fileObject, callback, id);
     });
  });
}


MediaHandler.prototype.playFile = function (res, platform, id) {
  var self = this;
  this.playback_entity.find(id)
  .success(function (object) {
      fileUtils.getLocalFile(self.media_dir, object.fileName, function(err, file) {
          if (err){
              logger.error(err);
          }

          if (file) {
              var fileUrl = file.href;

              var subtitleUrl = fileUrl;
              subtitleUrl     = subtitleUrl.split(".");
              subtitleUrl     = subtitleUrl[0]+".srt";

              var subtitleTitle   = object.fileName;
              subtitleTitle       = subtitleTitle.split(".");
              subtitleTitle       = subtitleTitle[0]+".srt";

              var type = self.media_type === 'Movie' ? 'movies' : self.media_type === 'Album' ? 'music' : 'tv';
              playback_handler.startPlayback(res, platform, object.id, fileUrl, object.fileName, subtitleUrl, subtitleTitle, type);
          } else {
              logger.error("File " + object.fileName + " could not be found!");
          }
      });
  });
};

MediaHandler.prototype.stopTranscoding = function(callback) {
    playback_handler.stopTranscoding();
    callback();
}

module.exports = MediaHandler;
