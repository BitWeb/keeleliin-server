/**
 * Created by taivo on 12.06.15.
 */

var workflowDefinitionDaoService = require(__base + 'src/service/dao/workflowDefinitionDaoService');
var WorkflowDefinitionServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceParamValue;
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;

function WorkflowDefinitionService() {

    this.getWorkflowDefinition = function(req, workflowDefinitionId, callback) {
        WorkflowDefinition.find({ where: {id: workflowDefinitionId }}).then(function(workflowDefinition) {

            return callback(null, workflowDefinition);
        }).catch(function(error) {

            return callback(error);
        });
    };

    this.getWorkflowDefinitionsByProject = function(req, projectId, callback) {

        return workflowDefinitionDaoService.findWorkflowDefinitionsByProjectId(projectId, callback);
    };

    this.getWorkflowDefinitionServiceParamValues = function(req, workflowDefinitionServiceId, callback) {

        return workflowDefinitionDaoService.findWorkflowDefinitionServiceParamValues(workflowDefinitionServiceId, callback);
    };

}

module.exports = new WorkflowDefinitionService();