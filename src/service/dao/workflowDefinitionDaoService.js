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

    this.getWorkflowDefinition = function(id, callback) {
        WorkflowDefinition.find({
            where: { id: id }
        }).then(function(workflowDefinition) {
            if (!workflowDefinition) {
                return callback('Not found.');
            }
            return callback(null, workflowDefinition);
        }).catch(function() {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.findWorkflowDefinition = function(id, callback) {
        WorkflowDefinition.find({
            include: [
                {
                    model: WorkflowDefinitionServiceModel,
                    as: 'workflowServices',
                    attributes: ['id', 'serviceId', 'orderNum']
                }
            ],
            where: { id: id }
        }).then(function(workflowDefinition) {
            if (!workflowDefinition) {
                return callback('Not found.');
            }
            return callback(null, workflowDefinition);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.findWorkflowDefinitionsByProjectId = function(projectId, callback) {
        WorkflowDefinition.findAll({
            include: [
                {
                    model: WorkflowDefinitionServiceModel,
                    as: 'workflowServices',
                    attributes: ['id', 'serviceId', 'orderNum']
                }
            ]
        }).then(function(workflowDefinitions) {
            return callback(null, workflowDefinitions);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.findWorkflowDefinitionServiceParamValues = function(workflowDefinitionServiceId, callback) {

        WorkflowDefinitionServiceParamValue.findAll({
            attributes: ['id', 'value'],
            include: [
                {
                    model: ServiceModelParam,
                    as: 'serviceParam',
                    attributes: ['id', 'type', 'key', 'value', 'orderNum', 'isEditable', 'description']
                }
            ],
            where: {
                workflowDefinitionServiceId: workflowDefinitionServiceId
            }
        }).then(function(workflowDefinitionServiceModels) {
            return callback(null, workflowDefinitionServiceModels);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
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
                            attributes: ['id', 'type', 'key', 'value', 'orderNum', 'isEditable', 'description']
                        }
                    ]
                }
            ],
            where: {
                id: workflowDefinitionServiceModelId
            },
            order: [
                /* Ordering workflow service model parameters via param value order num */
                [{model: WorkflowDefinitionServiceParamValue, as: 'paramValues'}, {model: ServiceModelParam, as: 'serviceParam'}, 'orderNum', 'ASC']
            ]
        }).then(function(workflowDefinitionServiceModel) {
            if (!workflowDefinitionServiceModel) {
                return callback('Not found.');
            }

            return callback(null, workflowDefinitionServiceModel);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });

    };

}

module.exports = new WorkflowDefinitionDaoService();