/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('workflow_instance_builder');
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowService = require(__base + 'src/service/dao/sql').WorkflowService;
var WorkflowServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowServiceParamValue;
var async = require('async');

function WorkflowBuilder(){
    var self = this;

    this.create = function (workflowId, cb) {

        async.waterfall([
                function (callback) {
                    Workflow.find({where:{id:workflowId}}).then(function (workflow) {
                        if(!workflow){
                            callback('Töövoogu ei leitud');
                        }
                        callback(null, workflow);
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
                        self.setServices(workflow, workflowDefinition, function (err, workflow) {
                            callback(err, workflow, workflowDefinition);
                        })
                    });
                },
                function lockDefinition(workflow, workflowDefinition, callback) {
                    workflowDefinition.updateAttributes({editStatus: WorkflowDefinition.editStatuses.LOCKED}).then(function () {
                        callback(null, workflow);
                    }).catch(function (err) {
                        callback( err.message );
                    });
                }
            ],
            function(err, workflow){
                if(err){
                    logger.error(err);
                    return cb(err);
                }
                cb(null, workflow);
        });
    };

    this.setServices = function (workflow, workflowDefinition, cb) {

        workflowDefinition.getDefinitionServices().then(function (definitionServices) {
            logger.info('Got definition services: ' + definitionServices.length);
            self.copyDefinitionServicesToServices(definitionServices, workflow, cb);
        }).catch(function (err) {
            cb(err.message);
        });
    };

    this.copyDefinitionServicesToServices = function(definitionServices, workflow, cb){

        async.each(definitionServices,
            function (definitionService, callback) {
                logger.info('Copy definition service id: ' + definitionService.id);
                self.copyDefinitionService(definitionService, workflow, callback);
            }, function(err){
                if(err){
                    logger.error('Definition services copy failed');
                    logger.error(err);
                    return cb(err);
                }
                logger.debug('Definition services copied');
                cb( null, workflow);
            }
        );
    };

    this.copyDefinitionService = function (definitionService, workflow, cb) {

        var data = {
            serviceId: definitionService.serviceId,
            workflowId: workflow.id,
            orderNum: definitionService.orderNum
        };

        WorkflowService.build(data).save().then(function (workflowService) {
            self.copyDefinitionServiceParamValues(definitionService, workflowService, cb);
        }).catch(cb);
    };

    this.copyDefinitionServiceParamValues = function (definitionService, workflowService, cb){
        logger.info('Copy definition service param values from ' + workflowService.id +' to '+ definitionService.id);
        async.waterfall([
            function (callback) {
                definitionService.getParamValues().then(function (values) {
                        return callback(null, values)
                    }).catch(function (err) {
                        logger.error(err);
                        callback(err);
                    });
            },
            function (definitionValues, callback) {
                logger.info('Param values to copy: ' + definitionValues.length);
                async.each(definitionValues, function(item, itemCallback){
                    self.copyDefinitionServiceParamValue(item, workflowService, itemCallback);
                }, callback);
            }
        ], cb);
    };

    this.copyDefinitionServiceParamValue = function (definitionParamValue, workflowService, cb) {

        logger.info('Copy definition param value: ' + definitionParamValue.id);
        var data = {
            workflowServiceId: workflowService.id,
            serviceParamId: definitionParamValue.serviceParamId,
            value: definitionParamValue.value
        };

        var workflowServiceParamValue = WorkflowServiceParamValue.build(data).save().then(function (item) {
            cb(null, item);
        }).catch(cb);
    }
}

module.exports = new WorkflowBuilder();