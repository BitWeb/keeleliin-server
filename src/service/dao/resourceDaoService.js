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
            andConditions.push('project.id = '+ query.projectId);
        }

        if(query.workflowId){
            andConditions.push('workflow.id = ' + query.workflowId);
        }

        if(query.type){
            if(query.type == 'input'){
                andConditions.push('outputWorkflow.id != workflow.id');
            } else if(query.type == 'output'){
                andConditions.push(' outputWorkflow.id = workflow.id');
            }
        }

        var whereCondition = '';
        if(andConditions.length > 0){
            whereCondition = ' AND ' + andConditions.join(' AND ')
        }

        var query = " SELECT " +
            " resource.id, " +
            " resource.name, " +
            " resource.created_at as created_at, " +
            " project.id AS project_id, " +
            " project.name AS project_name, " +
            " workflow.id as workflow_id, " +
            " workflow.name as workflow_name, " +
            /*" substepInputWorkflow.id as substep_input_workflow, " +
            " inputWorkflow.id as workflow_input_workflow, " +
            " outputWorkflow.id as workflow_output_workflow, " +*/
            " CASE WHEN outputWorkflow.id = workflow.id THEN 'output' ELSE 'input' END AS context_type " +
            " FROM resource as resource " +
            //projekti ressursid üldiselt
            " LEFT JOIN project_has_resource AS phr ON ( phr.resource_id = resource.id ) " +
            " LEFT JOIN project AS project ON ( phr.project_id = project.id ) " +

            //töövoo sammu sisendid
            " LEFT JOIN workflow_service_substep_has_input_resource AS substepResource ON (resource.id = substepResource.resource_id ) " +
            " LEFT JOIN workflow_service_substep AS serviceSubstep ON ( substepResource.workflow_service_substep_id = serviceSubstep.id ) " +
            " LEFT JOIN workflow_service AS wfService ON ( wfService.id = serviceSubstep.workflow_service_id ) " +
            " LEFT JOIN workflow AS substepInputWorkflow ON ( substepInputWorkflow.id = wfService.workflow_id ) " +
            //tövoo sisend
            " LEFT JOIN workflow_has_input_resource AS wfInput ON ( wfInput.resource_id = resource.id ) " +
            " LEFT JOIN workflow AS inputWorkflow ON ( inputWorkflow.id = wfInput.workflow_id ) " +

            //töövoo väljund
            " LEFT JOIN workflow_service_substep AS outputSubstep ON ( outputSubstep.id = resource.workflow_service_substep_id ) " +
            " LEFT JOIN workflow_service AS outputWdService ON ( outputWdService.id = outputSubstep.workflow_service_id ) " +
            " LEFT JOIN workflow AS outputWorkflow ON ( outputWorkflow.id = outputWdService.workflow_id ) " +
            //ressursi töövoog
            " LEFT JOIN workflow AS workflow ON ( workflow.project_id = project.id AND (substepInputWorkflow.id = workflow.id OR inputWorkflow.id = workflow.id OR outputWorkflow.id = workflow.id )) " +
            //" WHERE resource.id IS NOT NULL " +
            " WHERE  (( workflow.id IS NOT NULL AND (substepInputWorkflow.id IS NOT NULL OR inputWorkflow.id IS NOT NULL OR outputWorkflow.id IS NOT NULL ) ) OR workflow.id IS NULL) " +
            whereCondition +
            " GROUP BY resource.id, resource.name, resource.created_at, project.id, project.name, workflow.id, workflow.name, outputWorkflow.id" +
            " ORDER BY resource.id; ";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT}).then(function (resources) {
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