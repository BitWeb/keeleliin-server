/**
 * Created by taivo on 12.06.15.
 */
var logger = require('log4js').getLogger('workflow_definition_dao_service');
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
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
            " wfd.access_status as access_status, " +
            " wfd.published_at as published_at " +
            " FROM workflow_definition as wfd " +
            " WHERE " +
            " wfd.access_status = '" + WorkflowDefinition.accessStatuses.PUBLIC + "'";

        //Isiklikud
        var personalQuery = " SELECT " +
            " wfd.id as id," +
            " wfd.name as name," +
            " wfd.description as description," +
            " wfd.purpose as purpose," +
            " wfd.edit_status as edit_status," +
            " '" + WorkflowDefinition.accessStatuses.PRIVATE + "' as access_status, " +
            " null as published_at " +
            " FROM workflow_definition as wfd " +
            " WHERE " +
            " wfd.user_id = :userId ";

        //Mulle jagatud
        var sharedQuery = " SELECT " +
            " wfd.id as id," +
            " wfd.name as name," +
            " wfd.description as description," +
            " wfd.purpose as purpose," +
            " wfd.edit_status as edit_status," +
            " wfd.access_status as access_status, " +
            " null as published_at " +
            " FROM workflow_definition as wfd " +
            " JOIN workflow_definition_user AS wfdu ON ( wfdu.user_id = :userId AND wfdu.workflow_definition_id = wfd.id )" +
            " WHERE " +
            " wfd.access_status = '" + WorkflowDefinition.accessStatuses.SHARED + "' " +
            " AND wfd.user_id != :userId ";

        var totalQuery = " SELECT " +
            " definition.id, " +
            " definition.name, " +
            " definition.description, " +
            " definition.purpose, " +
            " definition.edit_status, " +
            " definition.access_status, " +
            " definition.published_at as published_at, " +
            " u.name AS owner " +
            " FROM ((" + publicQuery + ") UNION ALL ("+ personalQuery + ") UNION ALL ("+ sharedQuery + ") ) as definition " +
            " JOIN workflow_definition_user AS wdu ON (wdu.workflow_definition_id = definition.id AND wdu.role = '"+ WorkflowDefinitionUser.roles.OWNER +"')" +
            " JOIN \"user\" AS u ON (u.id = wdu.user_id)" +
            " WHERE NOT EXISTS ( " +
            "   SELECT wds.id FROM workflow_definition_service as wds " +
            "   JOIN service ON (service.id = wds.service_id AND service.is_active = FALSE)  " +
            "   WHERE wds.workflow_definition_id = definition.id )" +
            " ORDER BY definition.name; ";

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

    this.getProjectWorkflowDefinitionsList = function (projectId, cb) {

        var query = " SELECT " +
            " wfd.id as id," +
            " wfd.name as name," +
            " wfd.description as description," +
            " wfd.purpose as purpose," +
            " wfd.edit_status as edit_status," +
            " wfd.access_status as access_status, " +
            " wfd.published_at as published_at, " +
            " wfd.created_at as created_at, " +
            " wfd.updated_at as updated_at, " +
            " COUNT( wf.id ) as usage_count" +
            " FROM workflow_definition as wfd " +
            " LEFT JOIN workflow AS wf ON ( wf.workflow_definition_id = wfd.id ) " +
            " WHERE " +
            " wfd.project_id = :projectId " +
            " GROUP BY wfd.id " +
            " ORDER BY wfd.name;";

        sequelize.query( query, {
            replacements: { projectId: projectId },
            type: sequelize.QueryTypes.SELECT
        }).then(function (workflowDefinitions) {
            return cb(null, workflowDefinitions);
        }).catch(function (err) {
            logger.error(err);
            return cb(err.message);
        });
    };

    this.getWorkflowDefinitionsManagementList = function ( params, cb) {

        var where = '';

        if(params.name && params.accessStatus){
            where = " WHERE wfd.name ILIKE '%" + params.name + "%' AND  wfd.access_status = '" + params.accessStatus + "' ";
        } else if( params.name ){
            where = " WHERE wfd.name ILIKE '%" + params.name + "%' ";
        } else if( params.accessStatus ){
            where = " WHERE wfd.access_status = '" + params.accessStatus + "' ";
        }

        var limits = '';
        if( params.page && params.perPage ){
            limits = " LIMIT " + params.perPage + " OFFSET " + ((params.page - 1) * params.perPage);
        }

        var countQuery = " SELECT " +
            " COUNT(wfd.id) as total_count" +
            " FROM workflow_definition as wfd " + where + " ;";

        var query = " SELECT " +
            " wfd.id as id," +
            " wfd.name as name," +
            " wfd.description as description," +
            " wfd.purpose as purpose," +
            " wfd.edit_status as edit_status," +
            " wfd.access_status as access_status, " +
            " wfd.published_at as published_at, " +
            " wfd.created_at as created_at, " +
            " wfd.updated_at as updated_at, " +
            " COUNT( wf.id ) as usage_count" +
            " FROM workflow_definition as wfd " +
            " LEFT JOIN workflow AS wf ON ( wf.workflow_definition_id = wfd.id ) " +
            " " + where + " " +
            " GROUP BY wfd.id " +
            " ORDER BY wfd.name " + limits + ";";

        var result = {
            count: 0,
            rows: []
        };

        sequelize.query(countQuery, {
            replacements: {/*projectId: projectId*/},
            type: sequelize.QueryTypes.SELECT
        }).then(function (countResult) {
            result.count = countResult.pop().total_count;
            sequelize.query(query, {
                replacements: {/*projectId: projectId*/},
                type: sequelize.QueryTypes.SELECT
            }).then(function (workflowDefinitions) {
                result.rows = workflowDefinitions;
                return cb(null, result);
            }).catch(function (err) {
                logger.error(err);
                return cb(err.message);
            });
        }).catch(function (err) {
            logger.error(err);
            return cb(err.message);
        });
    }
}

module.exports = new WorkflowDefinitionDaoService();