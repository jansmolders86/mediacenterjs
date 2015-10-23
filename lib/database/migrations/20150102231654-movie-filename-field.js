"use strict";

module.exports = {
    up: function (queryInterface, Sequelize) {
        return Sequelize.Promise.join(
            queryInterface.renameColumn('Movies', 'originalName', 'filePath'),
            queryInterface.renameColumn('Episodes', 'fileName', 'filePath')
        );
    },
    down: function (queryInterface, Sequelize) {
        return Sequelize.Promise.join(
            queryInterface.renameColumn('Movies', 'filePath', 'originalName'),
            queryInterface.renameColumn('Episodes', 'filePath', 'fileName')
        );
    }
};
