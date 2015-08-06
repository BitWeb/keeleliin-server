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

        var andConditions = [];

        if(query.projectId){
            andConditions.push('project_id = '+ query.projectId);
        }

        if(query.workflowId){
            andConditions.push('workflow_id = ' + query.workflowId);
        }

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

        var resourceHasNoWorkflow =  " SELECT " +
            " resource.id, " +
            " resource.name, " +
            " resource.created_at as created_at, " +
            " project.id AS project_id, " +
            " project.name AS project_name, " +
            " null as workflow_id, " +
            " NULL as workflow_name, " +
            " 'input' AS context_type " +
            " FROM resource as resource " +
            " LEFT JOIN project_has_resource AS phr ON ( phr.resource_id = resource.id ) " +
            " LEFT JOIN project AS project ON ( phr.project_id = project.id ) " +
            " LEFT JOIN workflow AS workflow ON ( workflow.project_id = project.id )" +
            " WHERE workflow.id IS NULL ";

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
            " WHERE workflow.project_id = project.id ";

        var resourceIsWfInput = " SELECT " +
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
            " WHERE workflow.project_id = project.id ";

        var totalQuery = " SELECT " +
            " id, " +
            " name, " +
            " created_at, " +
            " project_id, " +
            " project_name, " +
            " workflow_id, " +
            " workflow_name, " +
            " context_type " +
            " FROM ( (" + resourceHasNoWorkflow + ") UNION ALL (" + resourceIsOutput + ") UNION ALL (" + resourceIsWfInput + ") ) as resource " +
            whereCondition +
            " ORDER BY id; ";

        sequelize.query( totalQuery, { type: sequelize.QueryTypes.SELECT}).then(function (resources) {
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

}

module.exports = new ResourceDaoService();

/*
 SELECT
 resource.id,
 resource.name,
 resource.created_at as created_at,
 project.id AS project_id,
 workflow.id AS workflow_id,
 wfhir.resource_id as input_resource_id,
 outputResource.id AS outputResource
 FROM resource as resource
 LEFT JOIN project_has_resource AS phr ON ( phr.resource_id = resource.id )
 LEFT JOIN project as project ON ( project.id = phr.project_id )
 LEFT JOIN workflow as workflow ON ( workflow.project_id = project.id )
 LEFT JOIN workflow_has_input_resource AS wfhir ON ( wfhir.resource_id = resource.id AND wfhir.workflow_id = workflow.id  )
 LEFT JOIN workflow_service wfs ON ( wfs.workflow_id = workflow.id )
 LEFT JOIN workflow_service_substep AS wfss ON ( wfs.id = wfss.workflow_service_id AND resource.workflow_service_substep_id = wfss.id )
 LEFT JOIN resource AS outputResource ON ( outputResource.workflow_service_substep_id = wfss.id AND resource.id = outputResource.id )


 WHERE ((workflow.id IS NOT NULL AND (wfss.id IS NOT NULL OR wfhir.resource_id IS NOT NULL ))
 OR
 ( workflow.id IS NULL AND wfss.id IS NULL AND wfhir.resource_id IS NULL ))
 AND project.id = 1
 GROUP BY resource.id, project.id, workflow.id, wfhir.resource_id, outputResource.id
 ORDER BY workflow.id

 ;
* */