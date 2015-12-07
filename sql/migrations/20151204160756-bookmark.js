'use strict';

var Promise = require('bluebird');
var fs = require('fs');


module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise
        .resolve()
        .then(function () {
          return queryInterface.sequelize.query("CREATE TABLE user_bookmark_definition " +
          " ( " +
          " created_at timestamp with time zone NOT NULL, " +
          " user_id integer NOT NULL, " +
          " workflow_definition_id integer NOT NULL, " +
          " CONSTRAINT user_bookmark_definition_pkey PRIMARY KEY (user_id, workflow_definition_id), " +
          " CONSTRAINT user_bookmark_definition_user_id_fkey FOREIGN KEY (user_id) " +
          " REFERENCES \"user\" (id) MATCH SIMPLE " +
          " ON UPDATE CASCADE ON DELETE CASCADE, " +
          " CONSTRAINT user_bookmark_definition_workflow_definition_id_fkey FOREIGN KEY (workflow_definition_id) " +
          " REFERENCES workflow_definition (id) MATCH SIMPLE " +
              " ON UPDATE CASCADE ON DELETE CASCADE " +
          " )");
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
