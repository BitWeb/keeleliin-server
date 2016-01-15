'use strict';

var Promise = require('bluebird');
var fs = require('fs');


module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise
        .resolve()
        .then(function () {
          return queryInterface.sequelize.query(" UPDATE \"user\" SET displaypicture = 'https://entu.keeleressursid.ee/api2/entity-3338/picture' WHERE id = 1");
        }).then(function () {
            return queryInterface.sequelize.query(" UPDATE \"user\" SET displaypicture = 'https://entu.keeleressursid.ee/api2/entity-4/picture' WHERE id = 2");
        }).then(function () {
            return queryInterface.sequelize.query(" UPDATE \"user\" SET displaypicture = 'https://entu.keeleressursid.ee/api2/entity-631/picture' WHERE id = 3");
        }).then(function () {
            return queryInterface.sequelize.query(" UPDATE \"user\" SET displaypicture = 'https://entu.keeleressursid.ee/api2/entity-630/picture' WHERE id = 4");
        }).then(function () {
            return queryInterface.sequelize.query(" UPDATE \"user\" SET displaypicture = 'https://entu.keeleressursid.ee/api2/entity-651/picture' WHERE id = 7");
        }).then(function () {
            return queryInterface.sequelize.query(" UPDATE \"user\" SET displaypicture = 'https://entu.keeleressursid.ee/api2/entity-630/picture' WHERE id = 8");
        }).then(function () {
            return queryInterface.sequelize.query("UPDATE \"user\" SET displaypicture = 'https://entu.keeleressursid.ee/api2/entity-650/picture' WHERE id = 9");
        }).then(function () {
            return queryInterface.sequelize.query(" UPDATE \"user\" SET displaypicture = 'https://entu.keeleressursid.ee/api2/entity-693/picture' WHERE id = 11");
        }).then(function () {
            return queryInterface.sequelize.query(" UPDATE \"user\" SET displaypicture = 'https://entu.keeleressursid.ee/api2/entity-649/picture' WHERE id = 14");
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
