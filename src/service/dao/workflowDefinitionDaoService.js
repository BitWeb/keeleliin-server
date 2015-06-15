/**
 * Created by taivo on 12.06.15.
 */

var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var WorkflowDefinitionServiceModel = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceModel;
var WorkflowDefinitionServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceParamValue;
var ServiceModelParam = require(__base + 'src/service/dao/sql').ServiceModelParam;
//var sequelize = require(__base + 'src/service/dao/sql').sequelize;

function WorkflowDefinitionDaoService() {

    var self = this;

    this.findWorkflowDefinitionsByProjectId = function(projectId, callback) {
        WorkflowDefinition.findAll({
            include: [
                {
                    model: WorkflowDefinitionServiceModel,
                    as: 'workflow_services',
                    attributes: ['id', 'service_id', 'order_num']
                }
            ]
        }).then(function(workflowDefinitions) {
            return callback(null, workflowDefinitions);
        });
    };

    this.findWorkflowDefinitionServiceParamValues = function(workflowDefinitionServiceId, callback) {
        WorkflowDefinitionServiceParamValue.findAll({
            attributes: ['id', 'value'],
            include: [
                {
                    model: ServiceModelParam,
                    as: 'service_param',
                    attributes: ['id', 'type', 'key', 'value', 'order_num', 'is_editable', 'description']
                }
            ],
            where: {
                workflow_definition_service_id: workflowDefinitionServiceId
            }
        }).then(function(workflowDefinitionServiceModels) {
            return callback(null, workflowDefinitionServiceModels);
        });
    };

}

module.exports = new WorkflowDefinitionDaoService();