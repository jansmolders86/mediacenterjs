var dbSchema = require('./utils/database-schema');
var fileUtils = require('./utils/file-utils');
var configuration_handler = require('./handlers/configuration-handler');
var config = configuration_handler.initializeConfiguration();
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
    console.log('Error occurred while loading ' + self.list_entity.name + ' from DB!', err);
    callback(err);
  }).success(function (result) {
    if (!result || result.length <= 0) {
      if (!dontFetchMetadata) {
        self.fetchMetadata(function(err) {
          if (err) {
            callback(err);
          } else {
            self.load(findOptions, callback, true);
          }
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
      console.log('Error occurred while fetching Metadata for ' + self.list_entity.name, err);
      callback(err);
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
  baseMarker[this.playback_entity.name + 'Id'] = id;
  var newMarker = _.extend(baseMarker, { progression: progression, transcodingStatus: 'pending' });

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
     self.metadataFunc({ href: object.filePath, file: object.filePath.split('/').pop() }, callback, id);
  });
}


MediaHandler.prototype.playFile = function (res, platform, id) {
  var self = this;
  this.playback_entity.find(id)
  .success(function (object) {
      var type = self.playback_entity.name === 'Track' ? 'music' : 'video';
      var playback_handler = require('./handlers/' + type + '-playback')

      playback_handler.startPlayback(res, platform, object, self.playback_entity.name);
  });
};

MediaHandler.prototype.stopTranscoding = function(callback) {
    require('./handlers/video-playback').stopTranscoding();
    callback();
}

module.exports = MediaHandler;
