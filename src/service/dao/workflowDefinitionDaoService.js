/**
 * Created by taivo on 12.06.15.
 */
var logger = require('log4js').getLogger('workflow_definition_dao_service');
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var WorkflowDefinitionServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceParamValue;
var WorkflowDefinitionUser = require(__base + 'src/service/dao/sql').WorkflowDefinitionUser;
var sequelize = require(__base + 'src/service/dao/sql').sequelize;

function WorkflowDefinitionDaoService() {

    var self = this;

    this.getUserWorkflowDefinitionsList = function (params, callback) {

        //Avalikud
        var publicQuery = " SELECT " +
            " wfd.id as id," +
            " wfd.name as name," +
            " wfd.description as description," +
            " wfd.purpose as purpose," +
            " wfd.edit_status as edit_status," +
            " wfd.access_status as access_status" +
            " FROM workflow_definition as wfd " +
            " WHERE " +
            " wfd.access_status = '" + WorkflowDefinition.accessStatuses.PUBLIC + "'" +
            " AND wfd.deleted_at IS NULL ";

        //Isiklikud
        var personalQuery = " SELECT " +
            " wfd.id as id," +
            " wfd.name as name," +
            " wfd.description as description," +
            " wfd.purpose as purpose," +
            " wfd.edit_status as edit_status," +
            " '" + WorkflowDefinition.accessStatuses.PRIVATE + "' as access_status" +
            " FROM workflow_definition as wfd " +
            " WHERE " +
            " wfd.user_id = :userId " +
            " AND wfd.deleted_at IS NULL ";

        //Mulle jagatud
        var sharedQuery = " SELECT " +
            " wfd.id as id," +
            " wfd.name as name," +
            " wfd.description as description," +
            " wfd.purpose as purpose," +
            " wfd.edit_status as edit_status," +
            " wfd.access_status as access_status" +
            " FROM workflow_definition as wfd " +
            " JOIN workflow_definition_user AS wfdu ON ( wfdu.user_id = :userId AND wfdu.workflow_definition_id = wfd.id )" +
            " WHERE " +
            " wfd.access_status = '" + WorkflowDefinition.accessStatuses.SHARED + "' " +
            " AND wfd.user_id != :userId " +
            " AND wfd.deleted_at IS NULL ";

        var totalQuery = " SELECT " +
            " definition.* " +
            " FROM ((" + publicQuery + ") UNION ALL ("+ personalQuery + ") UNION ALL ("+ sharedQuery + ") ) as definition " +
            " ORDER BY definition.id; ";

        sequelize.query(totalQuery, {
            replacements: { userId: params.userId },
            type: sequelize.QueryTypes.SELECT
        }).then(function (workflowDefinitions) {
            return callback(null, workflowDefinitions);
        }).catch(function (err) {
            logger.error(err);
            return callback(err.message);
        });
    };
}

module.exports = new WorkflowDefinitionDaoService();