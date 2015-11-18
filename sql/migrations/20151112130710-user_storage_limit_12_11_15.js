'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {

    queryInterface.addColumn(
        'user',
        'disc_max',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
    );

    queryInterface.addColumn(
        'user',
        'disc_current',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
    );

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
