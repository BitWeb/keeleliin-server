'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {

    queryInterface.renameColumn('workflow_service_substep', 'log', 'error_log')

  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
