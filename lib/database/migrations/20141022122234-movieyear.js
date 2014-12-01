module.exports = {
  up: function(migration, DataTypes, done) {
  	migration.addColumn('Movies', 'year', DataTypes.INTEGER);
    done()
  },
  down: function(migration, DataTypes, done) {
  	migration.removeColumn('Movies', 'year');
    done()
  }
}
