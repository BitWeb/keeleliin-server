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

        var order;
        if(params.order == 'name_asc'){
            order = ' wfd.name ASC ';
        } else if(params.order == 'name_desc'){
            order = ' wfd.name DESC ';
        } else if(params.order == 'created_at_asc'){
            order = ' wfd.created_at ASC ';
        } else if(params.order == 'created_at_desc'){
            order = ' wfd.created_at DESC ';
        } else if(params.order == 'used_asc'){
            order = ' usage_count ASC ';
        } else if(params.order == 'used_desc'){
            order = ' usage_count DESC ';
        } else if(params.order == 'bookmarked_asc'){
            order = ' bookmarked_count ASC ';
        } else if(params.order == 'bookmarked_desc'){
            order = ' bookmarked_count DESC ';
        } else {
            order = ' wfd.name ASC ';
        }

        var andContitions = [];
        if(params.type == WorkflowDefinition.accessStatuses.PUBLIC){
            andContitions.push(" wfd.access_status = '" + WorkflowDefinition.accessStatuses.PUBLIC + "' ");
        } else if(params.type == WorkflowDefinition.accessStatuses.PRIVATE){
            andContitions.push(" wfd.user_id = :userId ");
        } else if(params.type == WorkflowDefinition.accessStatuses.SHARED){
            andContitions.push(" wfd.user_id != :userId ");
            andContitions.push(" wfd.access_status = '" + WorkflowDefinition.accessStatuses.SHARED + "' ");
        }

        if(params.type == 'bookmarked'){
            andContitions.push(" ubd.user_id > 0 ");
        }

        if(params.name){
            andContitions.push(" ( wfd.name ILIKE '%"+params.name+"%' OR wfd.description ILIKE '%"+params.name+"%' OR wfd.purpose ILIKE '%"+params.name+"%' OR u.name ILIKE '%"+params.name+"%' )");
        }

        var where = "";
        if(andContitions.length > 0){
            where = " AND " + andContitions.join(" AND ");
        }

        var query = " SELECT " +
            " wfd.id as id," +
            " wfd.name as name," +
            " wfd.description as description," +
            " wfd.purpose as purpose," +
            " wfd.edit_status as edit_status," +
            " wfd.access_status as access_status, " +
            " wfd.published_at as published_at, " +
            " wfd.created_at as created_at, " +
            " COUNT( DISTINCT wf.id ) as usage_count, " +
            " COUNT( DISTINCT ubd2.workflow_definition_id ) as bookmarked_count," +
            " CASE WHEN ubd.user_id > 0 THEN TRUE ELSE FALSE END AS is_bookmarked, " +
            " u.name AS owner " +
            " FROM workflow_definition as wfd " +
            " LEFT JOIN workflow AS wf ON ( wf.workflow_definition_id = wfd.id ) " +
            " LEFT JOIN user_bookmark_definition as ubd ON ( ubd.user_id = :userId AND ubd.workflow_definition_id = wfd.id ) " +
            " LEFT JOIN user_bookmark_definition as ubd2 ON ( ubd2.workflow_definition_id = wfd.id ) " +
            " LEFT JOIN project as p ON (p.id = wfd.project_id)" +
            " LEFT JOIN project_user as pu ON (pu.project_id = p.id AND pu.user_id = :userId)" +
            " JOIN \"user\" AS u ON (u.id = wfd.user_id) " +
            " WHERE (" +
            "   ( pu.user_id > 0 ) OR " +
            "   ( wfd.access_status = '" + WorkflowDefinition.accessStatuses.PUBLIC + "' ) OR  " +
            "   ( wfd.user_id = :userId ) OR " +
            "   ( wfd.user_id != :userId AND  wfd.access_status = '" + WorkflowDefinition.accessStatuses.SHARED + "' )" +
            " ) " +
            where +
            " GROUP BY wfd.id, ubd.user_id, u.name ORDER BY "+ order +" ";

        sequelize.query( query, {
            replacements: { userId: params.userId },
            type: sequelize.QueryTypes.SELECT
        }).then(function (workflowDefinitions) {
            return callback(null, workflowDefinitions);
        }).catch(function (err) {
            logger.error(err);
            return callback(err.message);
        });
    };

    this.getProjectWorkflowDefinitionsList = function (projectId, userId, cb) {

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
            " COUNT( wf.id ) as usage_count," +
            " CASE WHEN ubd.user_id > 0 THEN TRUE ELSE FALSE END AS is_bookmarked " +
            " FROM workflow_definition as wfd " +
            " LEFT JOIN workflow AS wf ON ( wf.workflow_definition_id = wfd.id ) " +
            " LEFT JOIN user_bookmark_definition as ubd ON ( ubd.user_id = :userId AND ubd.workflow_definition_id = wfd.id ) " +
            " WHERE " +
            " wfd.project_id = :projectId " +
            " GROUP BY wfd.id, ubd.user_id " +
            " ORDER BY wfd.name;";

        sequelize.query( query, {
            replacements: { projectId: projectId, userId: userId },
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

        var nameCondition = '';
        if(params.name){
            nameCondition = "( wfd.name ILIKE '%" + params.name + "%' OR wfd.description ILIKE '%" + params.name + "%' OR wfd.purpose ILIKE '%" + params.name + "%' OR u.name ILIKE '%" + params.name + "%' )";
        }

        if(params.name && params.accessStatus){
            where = " WHERE wfd.access_status = '" + params.accessStatus + "' AND " + nameCondition;
        } else if( params.name ){
            where = " WHERE " + nameCondition;
        } else if( params.accessStatus ){
            where = " WHERE wfd.access_status = '" + params.accessStatus + "' ";
        }

        var limits = '';
        if( params.page && params.perPage ){
            limits = " LIMIT " + params.perPage + " OFFSET " + ((params.page - 1) * params.perPage);
        }

        var countQuery = " SELECT " +
            " COUNT(wfd.id) as total_count" +
            " FROM workflow_definition as wfd " +
            " LEFT JOIN \"user\" AS u ON (u.id = wfd.user_id) " +
            "" + where + ";";

        var order;
        if(params.order == 'name_asc'){
            order = ' wfd.name ASC ';
        } else if(params.order == 'name_desc'){
            order = ' wfd.name DESC ';
        } else if(params.order == 'created_at_asc'){
            order = ' wfd.created_at ASC ';
        } else if(params.order == 'created_at_desc'){
            order = ' wfd.created_at DESC ';
        } else if(params.order == 'used_asc'){
            order = ' usage_count ASC ';
        } else if(params.order == 'used_desc'){
            order = ' usage_count DESC ';
        } else if(params.order == 'bookmarked_asc'){
            order = ' bookmarked_count ASC ';
        } else if(params.order == 'bookmarked_desc'){
            order = ' bookmarked_count DESC ';
        } else {
            order = ' wfd.name ASC ';
        }

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
            " COUNT( DISTINCT wf.id ) as usage_count, " +
            " COUNT( DISTINCT ubd.workflow_definition_id ) as bookmarked_count," +
            " u.name AS owner " +
            " FROM workflow_definition as wfd " +
            " LEFT JOIN workflow AS wf ON ( wf.workflow_definition_id = wfd.id ) " +
            " LEFT JOIN user_bookmark_definition as ubd ON ( ubd.workflow_definition_id = wfd.id ) " +
            " LEFT JOIN \"user\" AS u ON (u.id = wfd.user_id) " +
            " " + where + " " +
            " GROUP BY wfd.id, u.name " +
            " ORDER BY " + order + " " + limits + ";";

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