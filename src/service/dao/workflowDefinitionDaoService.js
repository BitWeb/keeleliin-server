/**
 * Created by taivo on 12.06.15.
 */
var logger = require('log4js').getLogger('workflow_definition_dao_service');
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var WorkflowDefinitionServiceModel = require(__base + 'src/service/dao/sql').WorkflowDefinitionService;
var WorkflowDefinitionServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceParamValue;
var ServiceModelParam = require(__base + 'src/service/dao/sql').ServiceParam;

function WorkflowDefinitionDaoService() {

    var self = this;

    this.findWorkflowDefinition = function(id, callback) {
        WorkflowDefinition.find({
            include: [
                {
                    model: WorkflowDefinitionServiceModel,
                    as: 'workflowServices',
                    attributes: ['id', 'service_id', 'order_num']
                }
            ],
            where: { id: id }
        }).then(function(workflowDefinition) {
            if (!workflowDefinition) {
                return callback('Not found.');
            }
            return callback(null, workflowDefinition);
        });
    };

    this.findWorkflowDefinitionsByProjectId = function(projectId, callback) {
        WorkflowDefinition.findAll({
            include: [
                {
                    model: WorkflowDefinitionServiceModel,
                    as: 'workflowServices',
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
                    as: 'serviceParam',
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

    this.findWorkflowDefinitionServiceModel = function(workflowDefinitionServiceModelId, callback) {
        WorkflowDefinitionServiceModel.find({
            include: [
                {
                    model: WorkflowDefinitionServiceParamValue,
                    attributes: ['id', 'value'],
                    as: 'paramValues',
                    include: [
                        {
                            model: ServiceModelParam,
                            as: 'service_param',
                            attributes: ['id', 'type', 'key', 'value', 'order_num', 'is_editable', 'description']
                        }
                    ]
                }
            ],
            where: {
                id: workflowDefinitionServiceModelId
            },
            order: [
                /* Ordering workflow service model parameters via param value order num */
                [{model: WorkflowDefinitionServiceParamValue, as: 'param_values'}, {model: ServiceModelParam, as: 'service_param'}, 'order_num', 'ASC']
            ]
        }).then(function(workflowDefinitionServiceModel) {
            if (!workflowDefinitionServiceModel) {
                return callback('Not found.');
            }

            return callback(null, workflowDefinitionServiceModel);
        });

    };

}

module.exports = new WorkflowDefinitionDaoService();