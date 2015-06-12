/**
 * Created by taivo on 12.06.15.
 */

var workflowDefinitionDaoService = require(__base + 'src/service/dao/workflowDefinitionDaoService');

function WorkflowDefinitionApiService() {

    this.getWorkflowDefinitionsByProject = function(req, projectId, callback) {

        return workflowDefinitionDaoService.findWorkflowDefinitionsByProjectId(projectId, callback);
    };

    this.getWorkflowDefinitionServiceModelsByWorkflowDefinition = function(req, workflowDefinitionId, callback) {

        return workflowDefinitionDaoService.findWorkflowDefinitionServiceModelsByWorkflowDefinition(workflowDefinitionId, callback);
    };

}

module.exports = new WorkflowDefinitionApiService();