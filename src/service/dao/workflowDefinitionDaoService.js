/**
 * Created by taivo on 12.06.15.
 */

var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var WorkflowDefinitionServiceModel = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceModel;
var Project = require(__base + 'src/service/dao/sql').Project;

function WorkflowDefinitionDaoService() {

    this.findWorkflowDefinitionsByProjectId = function(projectId, callback) {
        WorkflowDefinition.findAll({
            include: [
                {model: Project, where: {
                    id: projectId
                }}
            ]
        }).then(function(workflowDefinitions) {
            return callback(null, workflowDefinitions);
        });
    };

    this.findWorkflowDefinitionServiceModelsByWorkflowDefinition = function(workflowDefinitionId, callback) {
        WorkflowDefinitionServiceModel.findAll({
            where: {
                workflow_definition_id: workflowDefinitionId
            }
        }).then(function(workflowDefinitionServiceModels) {

            return callback(null, workflowDefinitionServiceModels);
        });
    };
}

module.exports = new WorkflowDefinitionDaoService();