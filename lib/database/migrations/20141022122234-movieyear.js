module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.addColumn('Movies', 'year', Sequelize.INTEGER);
    },
    down: function (queryInterface, Sequelize) {
        return queryInterface.removeColumn('Movies', 'year');
    }
}
