module.exports = {
  up: function(migration, DataTypes, done) {
    migration.showAllTables().success(function(tables) {
      if (tables.indexOf('Movies') === -1) {
        return done();
      }

      migration.describeTable('Movies').success(function(table) {
        if (table.year) return done();
        migration.addColumn('Movies', 'year', DataTypes.INTEGER);
        done();
      }).error(done);
    }).error(done);
  },
  down: function(migration, DataTypes, done) {
    migration.showAllTables().success(function(tables) {
      if (tables.indexOf('Movies') === -1) {
        return done();
      }

      migration.describeTable('Movies').success(function(table) {
        if (!table.year) return done();
        migration.removeColumn('Movies', 'year');
        done();
      }).error(done);
    }).error(done);
  }
};
