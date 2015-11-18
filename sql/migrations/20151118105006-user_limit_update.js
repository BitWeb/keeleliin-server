'use strict';

var Promise = require('bluebird');
var fs = require('fs');

module.exports = {
  up: function (queryInterface, Sequelize) {

    return Promise
        .resolve()
        .then(function () {
          return queryInterface.sequelize.query('UPDATE "user" SET disc_max = 1073741824;');
        }).then(function () {
          return queryInterface.sequelize.query('UPDATE "user" SET disc_current = 0 ');
        });
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
