'use strict';

var Promise = require('bluebird');
var fs = require('fs');

module.exports = {
  up: function (queryInterface, Sequelize) {

    return Promise
        .resolve()
        .then(function () {
          return queryInterface.sequelize.query('ALTER TABLE service ADD COLUMN parent_version_id integer;');
        }).then(function () {
          return queryInterface.sequelize.query('ALTER TABLE service ALTER COLUMN parent_version_id SET DEFAULT NULL;');
        }).then(function () {
          return queryInterface.sequelize.query('' +
              'ALTER TABLE service ' +
              'ADD CONSTRAINT service_parent_version_id_fkey FOREIGN KEY (parent_version_id) ' +
              'REFERENCES service (id) MATCH SIMPLE ' +
              'ON UPDATE CASCADE ON DELETE SET NULL;'
          );
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
