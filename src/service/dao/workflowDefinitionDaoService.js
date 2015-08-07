/**
 * Created by taivo on 12.06.15.
 */
var logger = require('log4js').getLogger('workflow_definition_dao_service');
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var WorkflowDefinitionServiceModel = require(__base + 'src/service/dao/sql').WorkflowDefinitionService;
var WorkflowDefinitionServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceParamValue;
var ServiceModelParam = require(__base + 'src/service/dao/sql').ServiceParam;
var WorkflowDefinitionUser = require(__base + 'src/service/dao/sql').WorkflowDefinitionUser;
var sequelize = require(__base + 'src/service/dao/sql').sequelize;

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

    this.findWorkflowDefinitionsPublished = function(projectId, userId, callback) {
        var query = "SELECT " +
            "workflow_definition.id AS id, " +
            "workflow_definition.name AS name, " +
            "workflow_definition.description AS description, " +
            "workflow_definition.date_created AS dateCreated, " +
            "workflow_definition.date_updated AS dateUpdated, " +
            "workflow_definition.is_public " +
            "FROM workflow_definition " +
            "LEFT JOIN workflow_definition_user ON (workflow_definition.id = workflow_definition_user.workflow_definition_id) " +
            "WHERE workflow_definition.project_id = :projectId" +
            " AND workflow_definition.user_id = :userId" +
            " OR workflow_definition_user.user_id = :userId" +
            " OR workflow_definition.is_public = :isPublic " +
            "GROUP BY workflow_definition.id";

        // TODO: include also workflow services in the result, if needed, needs to be separate query
        sequelize.query(query, {
            replacements: {projectId: projectId, userId: userId, isPublic: true},
            type: sequelize.QueryTypes.SELECT
        }).then(function (workflowDefinitions) {
            return callback(null, workflowDefinitions);
        }).catch(function (err) {
            logger.error(err.message);
            return callback(err.message);
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