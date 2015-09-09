/**
 * Created by taivo on 12.06.15.
 */

var logger = require('log4js').getLogger('workflow_service');

var async = require('async');
var projectService = require(__base + 'src/service/projectService');
var resourceService = require(__base + 'src/service/resourceService');
var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
var workflowDefinitionService = require(__base + 'src/service/workflowDefinitionService');
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var Resource = require(__base + 'src/service/dao/sql').Resource;
var User = require(__base + 'src/service/dao/sql').User;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var WorkflowServiceModel = require(__base + 'src/service/dao/sql').WorkflowService;
var ServiceModel = require(__base + 'src/service/dao/sql').Service;
var workflowBuilder = require(__base + 'src/service/workflow/workflowBuilder');
var WorkflowRunner = require(__base + 'src/service/workflow/workflowRunner');

var apiService = require('./workflow/service/apiService');

function WorkflowService() {

    var self = this;

    this.getWorkflowOverview = function ( req, id, callback ) {
        workflowDaoService.getWorkflowOverview( id, callback );
    };

    this.getWorkflowDefinitionOverview = function ( req, id, callback ) {
        workflowDaoService.getWorkflowDefinitionOverview( id, function (err, overview) {
            if(err){
               logger.error(err);
                callback(err);
            }
            callback(err, overview);
        });
    };

    this.runWorkflow = function (req, workflowId, callback) {

        workflowBuilder.create( workflowId, function (err, workflow) {
            if(err){
                return callback(callback);
            }

            var workflowRunner = new WorkflowRunner();
            workflowRunner.run(workflow.id, callback);
        });
    };

    this.setWorkflowStatusCanceled = function (req, workflowId, cb) {

        async.waterfall([
            function getWorkflow( callback ) {
                Workflow.find({
                    where: {
                        id: workflowId
                    }
                }).then(function (workflow) {
                    if (!workflow) {
                        return callback('Töövoogu ei leitud');
                    }
                    callback(null, workflow);
                }).catch(function (err) {
                    callback(err);
                });
            },
            function checkStatus( workflow, callback ) {
                if(workflow.status != Workflow.statusCodes.RUNNING){
                    return callback('Töövoog ei käi');
                }
                callback(null, workflow);
            },
            function updateStatus( workflow, callback ) {
                workflow.updateAttributes({
                    status: Workflow.statusCodes.CANCELLED
                }).then(function () {
                    callback(null, workflow);
                }).catch(function (err) {
                    callback(err);
                });
            },
            function sendProcessKillSignals( workflow, callback ) {

                self._killWorkflowRunningSubSteps(workflow, function (err) {
                    logger.info('Signals sent', err);
                });
                callback(null, workflow);
            }

        ], function (err, workflow) {
            if(err){
                return cb({
                    code: 404,
                    message: err
                });
            }
            self.getWorkflowOverview(req, workflowId, cb);
        });
    };

    this._killWorkflowRunningSubSteps = function ( workflow, cb ) {

        WorkflowServiceSubstep.findAll(
            {
                attributes: ['id', 'serviceSession'],
                where: {
                    status: Workflow.statusCodes.RUNNING
                },
                include: [
                    {
                        model: WorkflowServiceModel,
                        as: 'workflowService',
                        attributes: ['id'],
                        include: [
                            {
                                model: ServiceModel,
                                as: 'service',
                                attributes: ['url'],
                                required: true
                            },
                            {
                                model: Workflow,
                                as: 'workflow',
                                attributes: ['id'],
                                where: {
                                    id: workflow.id
                                },
                                required: true
                            }
                        ],
                        required: true
                    }
                ]
            }
        ).then(function (runningSubSteps) {
            async.each(
                runningSubSteps,
                function (substep, callback) {
                    var dto = {
                        id: substep.serviceSession,
                        url: substep.workflowService.service.url
                    };
                    apiService.killRequest(dto, function (err, respBody) {
                        if(err){
                            return callback();
                        }
                        logger.debug(respBody);
                        callback();
                    });
                },
                function (err) {
                    cb( err );
                }
            );
        });
    };


    this.getProjectWorkflowsList = function(req, projectId, callback) {
        logger.debug('Get project workflows list');
        projectService.getProject(req, projectId, function(err, project) {
            if (err) {
                return callback(err);
            }
            workflowDaoService.getProjectWorkflowsList(project.id, function (err, workflows) {
                var dto = [];
                for(i in workflows){
                    var item = workflows[i];

                    var progress = 100;
                    if(item.workflowServices.length > 0){
                        progress = Math.round((item.workflowServices.filter(function(value){return value.status == Workflow.statusCodes.FINISHED;}).length * 100) / item.workflowServices.length);
                    }
                    if(item.status == Workflow.statusCodes.INIT){
                        progress = 0;
                    }

                    var dtoItem = item.dataValues;
                    dtoItem.progress = progress;
                    dto.push(dtoItem);
                }
                return callback(err, dto);
            });
        });
    };


}

module.exports = new WorkflowService();