"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.renameColumn('Movies', 'originalName', 'filePath');
    migration.renameColumn('Episodes', 'fileName', 'filePath');
    done();
  },

  down: function(migration, DataTypes, done) {
    migration.renameColumn('Movies', 'filePath', 'originalName');
    migration.renameColumn('Episodes', 'filePath', 'fileName');
    done();
  }
};
