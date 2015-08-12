/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('workflow_instance_builder');

var projectDaoService = require(__base + 'src/service/dao/projectDaoService');
var workflowDefinitionDaoService = require(__base + 'src/service/dao/workflowDefinitionDaoService');
var resourceDaoService = require(__base + 'src/service/dao/resourceDaoService');

var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowService = require(__base + 'src/service/dao/sql').WorkflowService;
var WorkflowServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowServiceParamValue;
var async = require('async');


/*workflowService.getWorkflowOverview(req, req.params.workflowId, function(err, overview) {
 if (err) return res.status(403).send({errors: err});
 return res.send(overview);
 });*/



function WorkflowBuilder(){
    var self = this;

    var project;
    var workflowDefinition;
    var initResourceIds;
    var workflow;

    this.create = function (data, cb) {

        logger.debug('Init data: ' +  JSON.stringify(data));

        var projectId = data.projectId;
        var workflowDefinitionId = data.workflowDefinitionId;
        initResourceIds = data.resources;

        async.waterfall([
            function getProject(callback) {
                projectDaoService.getProject(projectId, function (err, data) {
                    if(err) return callback(err);
                    project = data;

                    if(!project){
                        return callback('Project not found');
                    }


                    logger.info('Got project: ' + data.id);
                    callback();
                });
            },
            function getWorkflowDefinition(callback) {
                workflowDefinitionDaoService.getWorkflowDefinition(workflowDefinitionId, function (err, data) {
                    if(err) return callback(err);
                    workflowDefinition = data;
                    logger.info('Got definition: ' + data.id);
                    callback();
                });
            }],
            function(err){
                if(err){
                    logger.debug(err);
                    return cb(err);
                }
                self.createWorkflow(cb);
        });
    };

    this.createWorkflow = function (cb) {

        var workflowData = {
            projectId: project.id,
            workflowDefinitionId: workflowDefinition.id
        };

        async.waterfall([
            function (callback) {
                Workflow.build(workflowData).save().then(function (item) {
                    if(!item) return cb('Err');
                    logger.info('Workflow created: ' + item.id);
                    workflow = item;
                    callback();
                }).catch(function (err) {
                    callback(err.message);
                });
            },
            function (callback) {
                self.setServices(callback);
            },
            function (callback) {
                self._setResources(callback);
            }
        ], function (err) {
            cb(err, workflow);
        });
    };

    this._setResources = function (cb) {
        async.eachSeries(
            initResourceIds,
            function (resourceId, callback) {
                logger.info('Add init resource: ' + resourceId);
                resourceDaoService.getResource(resourceId, function (err, resource) {
                    if(err) return callback(err);
                    logger.info('Got resource: ' + resource.id);
                    self._setResource(resource, function (err) {
                        logger.info('Back from resource: ' + resource.id);
                        callback(err);
                    });
                });
            }, function(err){
                if(err){
                    logger.error(err);
                }
                logger.debug('Resources are set');
                cb(err);
            }
        );
    };

    this._setResource = function (resource, cb) {
        async.waterfall([
            function (callback) {
                workflow.hasInputResource(resource).then(function (result) {
                    if(result == false){
                        workflow.addInputResource(resource).then(function () {
                            callback();
                        }).catch(function (err) {
                            return callback(err.message);
                        });
                    } else {
                        callback();
                    }
                }).catch(function (err) {
                    return callback(err.message);
                });
            },
            function (callback) {
                project.hasResource(resource).then(function (result) {
                    if(result == false){
                        project.addResource(resource).then(function () {
                            callback();
                        }).catch(function (err) {
                            return callback(err.message);
                        });
                    } else {
                        callback();
                    }
                }).catch(function (err) {
                    return callback(err.message);
                });
            }
        ], function (err) {
            logger.debug('Resource is set');
            cb(err);
        });
    };

    this.setServices = function (cb) {

        workflowDefinition.getWorkflowServices().then(function (definitionServices) {
            logger.info('Got definition services: ' + definitionServices.length);
            self.copyDefinitionServicesToServices(definitionServices, cb);
        }).catch(function (err) {
            cb(err.message);
        });
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
                cb();
            }
        );
    };

    this.copyDefinitionService = function (definitionService, cb) {

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

module.exports = WorkflowBuilder;