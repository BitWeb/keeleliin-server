/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('resource_dao_service');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var Project = require(__base + 'src/service/dao/sql').Project;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var WorkflowService = require(__base + 'src/service/dao/sql').WorkflowService;
var sequelize = require(__base + 'src/service/dao/sql').sequelize;

function ResourceDaoService() {

    this.getResources = function(query, callback) {

        var resourceHasNoWorkflow =  " SELECT " +
            " resource.id, " +
            " resource.name, " +
            " resource.created_at as created_at, " +
            " project.id AS project_id, " +
            " project.name AS project_name, " +
            " workflow.id as workflow_id, " +
            " NULL as workflow_name, " +
            " 'input' AS context_type " +
            " FROM resource as resource " +
            " LEFT JOIN project_has_resource AS phr ON ( phr.resource_id = resource.id ) " +
            " LEFT JOIN project AS project ON ( phr.project_id = project.id ) " +
            " LEFT JOIN workflow_has_input_resource AS workflow_hir ON ( workflow_hir.resource_id = resource.id )" +
            " LEFT JOIN workflow_service_substep_has_input_resource AS wss_hir ON ( wss_hir.resource_id = resource.id )" +
            " LEFT JOIN workflow_service_substep AS wss ON ( wss_hir.workflow_service_substep_id = wss.id OR wss.id = resource.workflow_service_substep_id )" +
            " LEFT JOIN workflow_service AS ws ON ( ws.id = wss.workflow_service_id )" +
            " LEFT JOIN workflow AS workflow ON ( workflow.project_id = project.id AND ( workflow_hir.workflow_id = workflow.id OR ws.workflow_id = workflow.id) )" +
            " WHERE resource.deleted_at IS NULL AND workflow.id IS NULL " +
            (query.projectId ?  (" AND project.id = " + query.projectId ) : "") +
            (query.workflowId ?  (" AND workflow.id = " + query.workflowId ) : "");

        var resourceIsOutput = " SELECT " +
            " resource.id, " +
            " resource.name, " +
            " resource.created_at as created_at, " +
            " project.id AS project_id, " +
            " project.name AS project_name, " +
            " workflow.id as workflow_id, " +
            " workflow.name as workflow_name, " +
            " 'output' AS context_type " +
            " FROM resource as resource " +
            " LEFT JOIN workflow_service_substep as serviceSubstep ON ( serviceSubstep.id = resource.workflow_service_substep_id ) " +
            " LEFT JOIN workflow_service AS outputWfService ON ( outputWfService.id = serviceSubstep.workflow_service_id ) " +
            " LEFT JOIN workflow AS workflow ON ( workflow.id = outputWfService.workflow_id ) " +
            " LEFT JOIN project_has_resource AS phr ON ( phr.resource_id = resource.id ) " +
            " LEFT JOIN project AS project ON ( project.id = phr.project_id ) " +
            " WHERE resource.deleted_at IS NULL AND workflow.project_id = project.id " +
            (query.projectId ?  (" AND project.id = " + query.projectId ) : "") +
            (query.workflowId ?  (" AND workflow.id = " + query.workflowId ) : "");

        var resourceIsWorkflowInput = " SELECT " +
            " resource.id, " +
            " resource.name, " +
            " resource.created_at as created_at, " +
            " project.id AS project_id, " +
            " project.name AS project_name, " +
            " workflow.id as workflow_id, " +
            " workflow.name as workflow_name, " +
            " 'input' AS context_type " +
            " FROM resource as resource " +
            " LEFT JOIN workflow_has_input_resource as workflowInput ON ( workflowInput.resource_id = resource.id )" +
            " LEFT JOIN workflow AS workflow ON ( workflow.id = workflowInput.workflow_id ) " +
            " LEFT JOIN project_has_resource AS phr ON ( phr.resource_id = resource.id ) " +
            " LEFT JOIN project AS project ON ( project.id = phr.project_id ) " +
            " WHERE resource.deleted_at IS NULL AND workflow.project_id = project.id " +
            (query.projectId ?  (" AND project.id = " + query.projectId ) : "") +
            (query.workflowId ?  (" AND workflow.id = " + query.workflowId ) : "");

        //Exclude some sub queries
        var queries = [];
        if(!query.workflowId || query.type != 'output'){

            logger.trace( resourceHasNoWorkflow );

            queries.push( resourceHasNoWorkflow );
        }
        if(query.type != 'input'){
            queries.push( resourceIsOutput );
        }
        if(query.type != 'output') {
            queries.push(resourceIsWorkflowInput);
        }

        var andConditions = [];
        if(query.type){
            if(query.type == 'input'){
                andConditions.push("context_type = 'input'");
            } else if(query.type == 'output'){
                andConditions.push("context_type = 'output'");
            }
        }
        var whereCondition = '';
        if(andConditions.length > 0){
            whereCondition = ' WHERE ' + andConditions.join(' AND ')
        }

        var totalQuery = " SELECT " +
            " id, " +
            " name, " +
            " created_at, " +
            " project_id, " +
            " project_name, " +
            " workflow_id, " +
            " workflow_name, " +
            " context_type " +
            " FROM ( " + queries.join(" UNION ALL ") + " ) as resource " +
            whereCondition +
            " ORDER BY id; ";

        sequelize.query( totalQuery, { type: sequelize.QueryTypes.SELECT}).then(function (resources) {
            logger.debug('Got resources: ' + resources.length );
            return callback(null, resources);
        }).catch(function (err) {
            logger.error(err.message);
            return callback(err.message);
        });
    };

    this.getResource = function(resourceId, callback) {

        Resource.find({ where: {id: resourceId }}).then(function(resource) {
            if(!resource){
                return callback('Resource not found');
            }
            return callback(null, resource);
        }).catch(function(error) {
            logger.error(error);
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.findResourcesPublished = function(projectId, userId, callback) {
        var query = "SELECT resource.id AS id, " +
            "resource.name AS name, " +
            "resource.created_at as created_at " +
            "FROM resource " +
            "LEFT JOIN resource_user ON (resource_user.resource_id = resource.id) " +
            "LEFT JOIN workflow_has_input_resource as workflowInput ON ( workflowInput.resource_id = resource.id )" +
            "LEFT JOIN workflow_service_substep as serviceSubstep ON ( serviceSubstep.id = resource.workflow_service_substep_id ) " +
            "LEFT JOIN workflow_service AS outputWfService ON ( outputWfService.id = serviceSubstep.workflow_service_id ) " +
            "LEFT JOIN workflow AS workflow ON ( workflow.id = outputWfService.workflow_id ) " +
            "LEFT JOIN project_has_resource AS phr ON (phr.resource_id = resource.id) " +
            "LEFT JOIN project AS project ON (phr.project_id = project.id) " +
            "WHERE ( phr.project_id = :projectId OR resource_user.user_id = :userId OR resource.is_public = :isPublic) AND resource.deleted_at IS NULL " +
            "GROUP BY resource.id";

        // Adding project info would require making separate query, because in this single query,
        // resources wouldn't be grouped if they belong to multiple projects -
        // it'll return each row per project resource.
        // TODO: exclude the project check if only published and shared resources for user are wanted

        sequelize.query(query, {
            replacements: {projectId: projectId, userId: userId, isPublic: true},
            type: sequelize.QueryTypes.SELECT
        }).then(function (resources) {
            return callback(null, resources);
        }).catch(function (err) {
            logger.error(err.message);
            return callback(err.message);
        });
    };
}

module.exports = new ResourceDaoService();
