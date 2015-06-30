/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('instance_builder');

var projectDaoService = require(__base + 'src/service/dao/projectDaoService');
var workflowDefinitionDaoService = require(__base + 'src/service/dao/workflowDefinitionDaoService');
var resourceDaoService = require(__base + 'src/service/dao/resourceDaoService');

var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;

var async = require('async');


function InstanceBuilder(){
    var self = this;

    var project;
    var workflowDefinition;
    var initResource;
    var workflow;

    this.create = function (projectId, workflowDefinitionId, resourceId, cb) {

        async.waterfall([
            function (callback) {
                projectDaoService.getProject(projectId, function (err, data) {
                    if(err) return cb(err);
                    project = data;
                    callback();
                });
            },
            function (callback) {
                workflowDefinitionDaoService.getWorkflowDefinition(workflowDefinitionId, function (err, data) {
                    if(err) return cb(err);
                    workflowDefinition = data;
                    callback();
                });
            },
            function (callback) {
                logger.error('Before resource');
                resourceDaoService.getResource(resourceId, function (err, data) {
                    if(err) return cb(err);
                    initResource = data;
                    logger.error('Resource id: ' + data.id);
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
            workflow = item;
            self.setServices(cb);
        }).catch(function(error) {
            logger.error(error);
            return cb(error);
        });
    };

    this.setServices = function (cb) {

        async.waterfall([
            function (callback) {
                workflowDefinition.getWorkflowServices().then(function (definitionServices) {
                    logger.error(definitionServices);
                    callback(definitionServices);
                });
            },
            function(definitionServices, callback){
                callback(definitionServices);
            }
        ], function(err, data){
            cb(err, data);
        });







    }



}

module.exports = InstanceBuilder;