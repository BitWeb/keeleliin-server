'use strict';

var Promise = require('bluebird');
var fs = require('fs');


module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise
        .resolve()
        .then(function () {
          return queryInterface.sequelize.query("" +
          " INSERT INTO notification_type ( application_context, code, url_template, message_template, is_send_email, mail_subject_template, notify_period_days ) " +
          " SELECT " +
          " 'workflow-definition', " +
          " 'workflow-definition-unpublished', " +
          " '{appUrl}/#/project/{projectId}/definition/{workflowDefinitionId}/view', " +
          " 'Töövoo kirjeldus \"{workflowDefinitionName}\" muudeti mitteavalikuks', " +
          " TRUE, " +
          " 'Töövoo kirjeldus \"{workflowDefinitionName}\" muudeti mitteavalikuks', " +
          " 0 " +
          " WHERE NOT EXISTS (SELECT 1 FROM notification_type WHERE notification_type.code = 'workflow-definition-unpublished'); ");
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
