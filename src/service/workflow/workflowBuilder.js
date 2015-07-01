/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('instance_builder');

var projectDaoService = require(__base + 'src/service/dao/projectDaoService');
var workflowDefinitionDaoService = require(__base + 'src/service/dao/workflowDefinitionDaoService');
var resourceDaoService = require(__base + 'src/service/dao/resourceDaoService');

var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowService = require(__base + 'src/service/dao/sql').WorkflowService;
var WorkflowServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowServiceParamValue;
var async = require('async');


function WorkflowBuilder(){
    var self = this;

    var project;
    var workflowDefinition;
    var initResource;
    var workflow;

    this.create = function (projectId, workflowDefinitionId, resourceIds, cb) {

        async.waterfall([
            function (callback) {
                projectDaoService.getProject(projectId, function (err, data) {
                    if(err) return cb(err);
                    project = data;
                    logger.info('Got project: ' + data.id);
                    callback();
                });
            },
            function (callback) {
                workflowDefinitionDaoService.getWorkflowDefinition(workflowDefinitionId, function (err, data) {
                    if(err) return cb(err);
                    workflowDefinition = data;
                    logger.info('Got definition: ' + data.id);
                    callback();
                });
            },
            function (callback) {
                resourceDaoService.getResource(resourceId, function (err, data) {
                    if(err) return cb(err);
                    initResource = data;
                    logger.info('Got resource: ' + data.id);
                    callback();
                });
            }],
            function(err){
                if(err) return cb(err);
                self.createWorkflow(cb);
        });
    };

    this.createWorkflow = function (cb) {

        var workflowData = {
            project_id: project.id,
            workflow_definition_id: workflowDefinition.id,
            input_resource_id: initResource.id
        };

        Workflow.build(workflowData).save().then(function (item) {
            if(!item) return cb('Err');
            logger.info('Workflow created: ' + item.id);
            workflow = item;
            self.setServices(cb);
        }).catch(cb);
    };

    this.setServices = function (cb) {

        workflowDefinition.getWorkflowServices().then(function (definitionServices) {
            logger.info('Got definition services: ' + definitionServices.length);
            self.copyDefinitionServicesToServices(definitionServices, cb);
        }).catch(cb);
    };

    this.copyDefinitionServicesToServices = function(definitionServices, cb){

        async.each(definitionServices,
            function (definitionService, callback) {
                logger.info('Copy definition service id: ' + definitionService.id);
                self.copyDefinitionService(definitionService, callback);
            }, function(err){
                if(err){
                    logger.error('Definition services copy failed');
                    logger.error(err);
                    return cb(err);
                }
                logger.debug('Definition services copied');
                cb(null, workflow);
            }
        );
    };

    this.copyDefinitionService = function (definitionService, cb) {

        var data = {
            service_id: definitionService.service_id,
            workflow_id: workflow.id,
            order_num: definitionService.order_num
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
            workflow_service_id: workflowService.id,
            service_param_id: definitionParamValue.service_param_id,
            value: definitionParamValue.value
        };

        var workflowServiceParamValue = WorkflowServiceParamValue.build(data).save().then(function (item) {
            cb(null, item);
        }).catch(cb);
    }
}

module.exports = WorkflowBuilder;