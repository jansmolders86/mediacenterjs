"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.renameColumn('Movies', 'originalName', 'fileName');
    done();
  },

  down: function(migration, DataTypes, done) {
    migration.renameColumn('Movies', 'fileName', 'originalName');
    done();
  }
};
