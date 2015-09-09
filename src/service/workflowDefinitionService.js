/**
 * Created by taivo on 12.06.15.
 */
var logger = require('log4js').getLogger('workflow_definition_service');
var workflowDefinitionDaoService = require(__base + 'src/service/dao/workflowDefinitionDaoService');
var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
var WorkflowDefinitionServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceParamValue;
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowDefinitionServiceModel = require(__base + 'src/service/dao/sql').WorkflowDefinitionService;
var projectService = require(__base + 'src/service/projectService');
var serviceService = require(__base + 'src/service/serviceService');
var async = require('async');
var ArrayUtils = require(__base + 'src/util/arrayUtils');
var userService = require('./userService');


function WorkflowDefinitionService() {

    var self = this;

    this.defineNewWorkflow = function(req, workflowDefinitionData, cb) {

        async.waterfall([
            function getCurrentUser(callback) {
                userService.getCurrentUser(req, callback);
            },
            function createDefinition(user, callback) {

                workflowDefinitionData.userId = user.id;
                var definition = WorkflowDefinition.build(workflowDefinitionData, {fields: ['name', 'description', 'purpose', 'projectId', 'userId']});

                definition.validate().then(function (err) {
                    if (err) {
                        return callback(err.message);
                    }
                    definition.save().then(function () {
                        callback(null, definition);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                });
            },
            function createInitWorkflowBasedOnDefinition(definition, callback) {
                var workflowData = {
                    projectId   : definition.projectId,
                    workflowDefinitionId: definition.id,
                    userId      : definition.userId,
                    name        : definition.name,
                    description : definition.description,
                    purpose     : definition.purpose
                };
                Workflow.create(workflowData).then(function (workflow) {
                    callback( null, workflow);
                }).catch(function (err) {
                    callback(err.message);
                });
            }
        ], function (err, workflow) {

            if(err){
               logger.error(err);
            }

            cb(err, workflow);
        });
    };


    this.updateDefinitionServices = function(req, workflowId, selectedServicesData, cb){
        async.waterfall([
                function getWorkflow(callback) {
                    workflowDaoService.getWorkflow(workflowId, callback);
                },
                function getDefinition(workflow, callback) {
                    workflow.getWorkflowDefinition().then(function (workflowDefinition) {
                        if(!workflowDefinition){
                            return callback('No definition found!');
                        }
                        callback(null, workflowDefinition);
                    }).catch(function (err) {
                        callback( err.message );
                    });
                },
                function checkDefinitionStatus(workflowDefinition, callback) {

                    if(workflowDefinition.editStatus != WorkflowDefinition.editStatuses.EDIT){
                        return callback('Definition is not in edit status');
                    }
                    callback(null, workflowDefinition);
                },
                function clearExistingServices(workflowDefinition, callback) {
                    logger.info('SET');
                    workflowDefinition.getDefinitionServices().then(function (items) {
                            async.each(
                                items,
                                function (item, innerCallback) {
                                    item.destroy().then(function () {
                                        innerCallback();
                                    })
                                },
                                function(err){
                                    callback(null, workflowDefinition);
                                }
                            );
                        }
                    ).catch(function (err) {
                        callback( err.message );
                    });
                },
                function updateServices(workflowDefinition, callback) {
                    async.each(selectedServicesData, function (selectedServiceData, innerCallback) {
                        self._saveWorkflowDefinitionService( workflowDefinition, selectedServiceData, innerCallback );
                    }, function (err) {
                        callback(err);
                    });
                }
            ],
            function (err) {
                if(err){
                    logger.error(err);
                    return cb(err);
                }
                cb(null, 'todo');
            }
        );
    };

    this._saveWorkflowDefinitionService = function ( workflowDefinition, serviceData, cb ) {

        async.waterfall(
            [
                function createService(callback) {
                    var data = {
                        serviceId: serviceData.serviceId,
                        orderNum: serviceData.orderNum,
                        workflowDefinitionId: workflowDefinition.id
                    };
                    var workflowDefinitionService = WorkflowDefinitionServiceModel.create(data).then(function (definitionService) {
                        callback(null, definitionService);
                    }).catch(function (err) {
                        callback( err.message );
                    });
                },
                function copyNotEditableParams(definitionService, callback) {
                    definitionService.getService().then( function ( service ) {
                        logger.debug('getServiceParams');
                        service.getServiceParams({
                            where: {isEditable: false }
                        }).then(function (params) {

                            var paramsMap = params.map(function (item) {
                                return {
                                    serviceParamId: item.id,
                                    value: item.value
                                }
                            });
                            self._addServiceParams(definitionService, paramsMap, callback);
                        }).catch(function (err) {
                            callback( err.message );
                        });
                    }).catch(function (err) {
                        callback( err.message );
                    });
                },
                function saveParams(definitionService, callback) {

                    logger.error(serviceData.paramValues);

                    self._addServiceParams(definitionService, serviceData.paramValues, callback);
                }
            ],
        function (err) {
            if(err){
                logger.error('_saveWorkflowDefinitionService  ', err);
            }
            cb(err);
        });
    };

    this._addServiceParams = function (definitionService, paramsMap, cb) {

        async.eachSeries(paramsMap, function (item, callback) {
            definitionService.getParamValues({where: {
                serviceParamId: item.serviceParamId
            }}).then(function (excistingValues) {
                if(excistingValues.length > 0){
                    return callback();
                }
                var paramValue = WorkflowDefinitionServiceParamValue.build(item, ['serviceParamId', 'value']);
                definitionService.addParamValue(paramValue).then(function () {
                    return callback();
                }).catch(function (err) {
                    logger.error(paramsMap);
                    callback( err.message );
                });
            });
        }, function (err) {
            if(err){
                logger.error('_addServiceParams ', err);
            }
            cb(err, definitionService);
        });
    };

}

module.exports = new WorkflowDefinitionService();