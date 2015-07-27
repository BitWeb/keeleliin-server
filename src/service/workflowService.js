/**
 * Created by taivo on 12.06.15.
 */


var resourceService = require(__base + 'src/service/resourceService');
var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
var workflowDefinitionService = require(__base + 'src/service/workflowDefinitionService');
var Workflow = require(__base + 'src/service/dao/sql').Workflow;

function WorkflowService() {

    var self = this;

    this.getWorkflow = function(req, workflowId, callback) {

        Workflow.find({ where: {id: workflowId }}).then(function(workflow) {

            return callback(null, workflow);
        }).catch(function(error) {

            return callback(error);
        });
    };

    this.getWorkflowsByProjectId = function(req, projectId, callback) {

        return workflowDaoService.findWorkflowsByProjectId(projectId, callback);
    };

    this.getWorkflowServiceParamValues = function(req, workflowServiceId, callback) {

        return workflowDaoService.findWorkflowServiceParamValues(workflowServiceId, callback);
    };
}

module.exports = new WorkflowService();