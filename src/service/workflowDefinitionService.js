/**
 * Created by taivo on 12.06.15.
 */

var workflowDefinitionDaoService = require(__base + 'src/service/dao/workflowDefinitionDaoService');
var WorkflowDefinitionServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceParamValue;
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var projectService = require(__base + 'src/service/projectService');

function WorkflowDefinitionService() {

    var self = this;

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

    this.createWorkflowDefinition = function(req, projectId, workflowDefinitionData, callback) {

        projectService.getProject(req, projectId, function(error, project) {
            if (error) {
                return callback(error);
            }
            var workflowDefinition = WorkflowDefinition.create(workflowDefinitionData).then(function(workflowDefinition) {

                project.addWorkflowDefinition(workflowDefinition).then(function() {

                    return callback(null, workflowDefinition);
                }).catch(function(error) {

                    return callback(error);
                });
            }).catch(function(error) {

                return callback(error);
            });
        });

    };

    this.saveWorkflowDefinition = function(req, workflowDefinitionId, workflowDefinitionData, callback) {

        self.getWorkflowDefinition(req, workflowDefinitionId, function(err, workflowDefinition) {
            if (err) {
                return callback(err);
            }

            workflowDefinition.updateAttributes(workflowDefinitionData).then(function(workflowDefinition) {

                return callback(null, workflowDefinition);
            }).catch(function(err) {

                return callback(err);
            });

        });
    };
}

module.exports = new WorkflowDefinitionService();