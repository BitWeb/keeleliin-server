/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('workflow_instance_builder');
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowService = require(__base + 'src/service/dao/sql').WorkflowService;
var async = require('async');

function WorkflowBuilder(){
    var self = this;

    this.create = function (workflowId, cb) {

        logger.debug('Create workflow');

        async.waterfall([
                function (callback) {
                    Workflow.findById( workflowId ).then(function (workflow) {
                        if(!workflow){
                            callback('Töövoogu ei leitud');
                        }
                        callback(null, workflow);
                    }).catch(function (err) {
                        logger.error(err);
                        callback( err.message );
                    });
                },
                function (workflow, callback) {

                    if(workflow.status != Workflow.statusCodes.INIT){
                        return callback('Töövoog ei ole INIT staatusega!');
                    }
                    callback(null, workflow);
                },
                function getWorkflowDefinition(workflow, callback) {

                    workflow.getWorkflowDefinition().then(function (workflowDefinition) {
                        callback(null, workflow, workflowDefinition);
                    }).catch(function (err) {
                        logger.error(err);
                        callback( err.message );
                    });
                },
                function (workflow, workflowDefinition, callback) {

                    workflowDefinition.getFirstDefinitionService(function (err, definitionService) {
                        if(err){
                            logger.error(err);
                            return callback(err);
                        }
                        self.validateWorkflowDefinitionFirstService(workflow, definitionService, function (err) {
                            callback(err, workflow, workflowDefinition);
                        });
                    });
                },
                function (workflow, workflowDefinition, callback) {

                    logger.debug('Copy definition services. workflow: ' + workflow.id);

                    workflowDefinition.getDefinitionServices().then(function (definitionServices) {
                        self.copyDefinitionServicesToServices(definitionServices, workflow, function () {
                            callback(null, workflow, workflowDefinition);
                        });
                    }).catch(function (err) {
                        logger.error(err);
                        callback(err.message);
                    });
                },
                function lockDefinition(workflow, workflowDefinition, callback) {

                    workflowDefinition.updateAttributes({editStatus: WorkflowDefinition.editStatuses.LOCKED}).then(function () {
                        callback(null, workflow);
                    }).catch(function (err) {
                        logger.error(err);
                        callback( err.message );
                    });
                }
            ],
            function(err, workflow){
                if(err){
                    return cb(err);
                }
                cb( null, workflow );
        });



    };

    this.validateWorkflowDefinitionFirstService = function(workflow, definitionService, cb){

        async.waterfall([
            function (callback) {
                if(!definitionService){
                    return callback('Töövoos puuduvad teenused.');
                }
                callback();
            },
            function (callback) {
                workflow.getInputResources().then(function(resources){
                    if(resources.length == 0){
                        callback('Töövool puuduvad sisendressursid.');
                    }
                    callback(null, resources);
                }).catch(function (err) {
                    logger.error(err);
                    callback( err.message );
                });
            },
            function (resources, callback) {

                definitionService.getService().then(function (service) {
                    service.getServiceInputTypes().then(function (inputTypes) {
                        for(var i = 0, iLength = inputTypes.length; i < iLength; i++ ){
                            var hasResource = false;
                            for(var j = 0, jLength = resources.length; j < jLength; j++){
                                if(inputTypes[i].resourceTypeId == resources[j].resourceTypeId ){
                                    hasResource = true;
                                }
                            }
                            if(hasResource === false){
                                return callback('Töövoole sobivat sisendresurssi ei leitud.');
                            }
                        }
                        return callback();
                    }).catch(function (err) {
                        logger.error(err);
                        callback( err.message );
                    });
                }).catch(function (err) {
                    logger.error(err);
                    callback( err.message );
                });
            }
        ], function (err) {
            cb(err);
        });
    };

    this.copyDefinitionServicesToServices = function(definitionServices, workflow, cb){

        async.each(definitionServices,
            function (definitionService, callback) {
                self.copyDefinitionService(definitionService, workflow, callback);
            }, function(err){
                if(err){
                    logger.error('Definition services copy failed', err);
                }
                cb( err, workflow);
            }
        );
    };

    this.copyDefinitionService = function (definitionService, workflow, cb) {

        var data = {
            serviceId: definitionService.serviceId,
            serviceParamsValues: definitionService.serviceParamsValues,
            workflowId: workflow.id,
            orderNum: definitionService.orderNum
        };

        WorkflowService.build(data).save().then(function (workflowService) {
            cb(null, workflow);
        }).catch(function (err) {
            logger.error(err);
            cb( err.message );
        });
    };
}

module.exports = new WorkflowBuilder();