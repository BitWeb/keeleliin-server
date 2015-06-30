/**
 * Created by taivo on 15.06.15.
 */

var Project = require(__base + 'src/service/dao/sql').Project;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowServiceModel = require(__base + 'src/service/dao/sql').WorkflowService;
var WorkflowServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowServiceParamValue;
var ServiceModelParam = require(__base + 'src/service/dao/sql').ServiceParam;

function WorkflowDaoService() {

    var self = this;

    this.findWorkflowsByProjectId = function(projectId, callback) {

        Workflow.findAll({
            attributes: ['id', 'workflow_definition_id', 'input_resource_id', 'status', 'datetime_start', 'datetime_end'],
            include: [
                {
                    model: Project,
                    as: 'project',
                    where: {id: projectId}
                },
                {
                    model: WorkflowServiceModel,
                    as: 'workflow_services',
                    attributes: ['id', 'service_id', 'workflow_definition_service_id', 'output_resource_id', 'status', 'datetime_start', 'datetime_end', 'order_num']
                }
            ]
        }).then(function(workflows) {
            return callback(null, workflows);
        });
    };

    this.findWorkflowServiceParamValues = function(workflowServiceId, callback) {
        WorkflowServiceParamValue.findAll({
            attributes: ['id', 'value'],
            include: [
                {
                    model: ServiceModelParam,
                    as: 'service_param',
                    attributes: ['id', 'type', 'key', 'value', 'order_num', 'is_editable', 'description']
                }
            ],
            where: {
                workflow_service_id: workflowServiceId
            }
        }).then(function(workflowDefinitionServiceModels) {
            return callback(null, workflowDefinitionServiceModels);
        });
    };

};

module.exports = new WorkflowDaoService();