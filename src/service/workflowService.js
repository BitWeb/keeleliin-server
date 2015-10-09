/**
 * Created by taivo on 12.06.15.
 */

var logger = require('log4js').getLogger('workflow_service');

var async = require('async');
var projectService = require(__base + 'src/service/projectService');
var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
var resourceDaoService = require(__base + 'src/service/dao/resourceDaoService');
var resourceService = require(__base + 'src/service/resourceService');
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var Resource = require(__base + 'src/service/dao/sql').Resource;
var ResourceAssociation = require(__base + 'src/service/dao/sql').ResourceAssociation;
var User = require(__base + 'src/service/dao/sql').User;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var WorkflowServiceModel = require(__base + 'src/service/dao/sql').WorkflowService;
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;

var WorkflowDefinitionService = require(__base + 'src/service/dao/sql').WorkflowDefinitionService;

var ServiceModel = require(__base + 'src/service/dao/sql').Service;
var WorkflowDefinitionUser = require(__base + 'src/service/dao/sql').WorkflowDefinitionUser;
var workflowBuilder = require(__base + 'src/service/workflow/workflowBuilder');
var WorkflowRunner = require(__base + 'src/service/workflow/workflowRunner');
var workflowDefinitionService = require('./workflowDefinitionService');
var apiService = require('./workflow/service/apiService');
var ObjectUtil = require('./../util/objectUtils');

function WorkflowService() {

    var self = this;

    this.getWorkflowOverview = function ( req, id, callback ) {
        workflowDaoService.getWorkflowOverview( id, callback );
    };

    this.getWorkflowDefinitionOverview = function ( req, workflowId, cb ) {

        async.waterfall([
                function getWorkflow( callback ) {
                    workflowDaoService.getWorkflow(workflowId, callback);
                },
                function ( workflow, callback ) {
                    workflow.getWorkflowDefinition().then(function (definition) {
                        if(definition){
                            callback(null, workflow, definition);
                        } else {
                            workflowDefinitionService.createDefinitionToWorkflow(req, workflow, function (err, definition) {
                                callback(null, workflow, definition);
                            });
                        }
                    });
                },
                function (workflow, definition, callback) {
                    var workflowData = ObjectUtil.mapProperties(workflow, [ 'id', 'projectId', 'status', 'workflowDefinitionId', 'userId', 'name', 'description', 'purpose' ]);
                    workflowData.workflowDefinitionId = definition.id;
                    workflowData.workflowDefinition = ObjectUtil.mapProperties(definition, [ 'id', 'editStatus' ]);
                    callback(null, workflowData);
                },
                function (workflowData, callback) {

                    WorkflowDefinitionService.findAll({
                        where: {
                            workflowDefinitionId: workflowData.workflowDefinitionId
                        },
                        attributes: [
                            'id',
                            'serviceId',
                            'orderNum',
                            'serviceParamsValues'
                        ],
                        order: "order_num ASC",
                        required: false
                    }).then(function ( definitionServices ) {
                        workflowData.workflowDefinition.definitionServices = definitionServices.map(function (item) {
                            return item.toJSON();
                        });
                        return callback(null, workflowData);
                    });
                }
            ],
            function (err, workflowData) {
                if(err){
                    logger.error(err);
                }
                cb(err, workflowData);
            }
        );
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
            function updateStatus( workflow, callback ) {
                if(workflow.status == Workflow.statusCodes.RUNNING){
                    workflow.updateAttributes({
                        status: Workflow.statusCodes.CANCELLED
                    }).then(function () {

                        self._killWorkflowRunningSubSteps(workflow, function (err) {
                            logger.info('Signals sent', err);
                        });
                        callback(null, workflow);
                    }).catch(function (err) {
                        callback(err);
                    });
                } else {
                    callback(null, workflow);
                }
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

                    if(!substep.serviceSession){
                        return callback();
                    }

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


    this.getProjectWorkflowsList = function(req, projectId, cb) {
        logger.debug('Get project workflows list');
        projectService.getProject(req, projectId, function(err, project) {
            if (err) {
                return callback(err);
            }
            workflowDaoService.getProjectWorkflowsList(project.id, function (err, workflows) {
                async.map(workflows,
                    function(workflow, innerCb){
                        var resultItem = workflow.dataValues;
                        workflow.getProgress(function (err, progress) {
                            resultItem.progress = progress;
                            innerCb(err, resultItem);
                        });
                    },
                    function(err, result){
                        cb(null, result);
                    }
                );
            });
        });
    };

    this.getWorkflowsManagementList = function (req, params, cb) {

        async.waterfall([

                function (callback) {
                    workflowDaoService.getWorkflowsManagementList( params, callback );
                },
                function (data, callback) {
                    async.map(
                        data.rows,
                        function (row, innerCb) {
                            row.getProgress(function (err, progress) {
                                row.dataValues.progress = progress;
                                innerCb(err, row);
                            });
                        },
                        function (err, resultRows) {
                        logger.debug(resultRows);
                            data.rows = resultRows;
                        callback(null, data);
                    });
                }
            ],
            function (err, data) {
                if(err){
                    logger.error(err);
                }
                cb(err, data);
            }
        );
    };

    this.addResources = function(req, workflowId, data, callback){

        logger.trace('Add resources', data);

        async.waterfall([
            function (callback) {
                workflowDaoService.getWorkflow(workflowId, callback);
            },
            function (workflow, callback) {
                if(workflow.status != Workflow.statusCodes.INIT){
                    return callback('Töövoog ei ole init staatusega');
                }
                callback(null,workflow);
            },
            function (workflow, callback) {
                workflow.getProject().then(function (project) {
                    callback(null, workflow, project);
                });
            },
            function (workflow, project, callback) {
                async.eachLimit(data.resources, 10, function (resourceId, innerCallback) {
                    if(!resourceId){
                        return innerCallback();
                    }
                    resourceDaoService.getResource(resourceId, function (err, resource) {
                        if(err){
                            logger.error(err);
                           return innerCallback();
                        }

                        var associationData = {
                            context: ResourceAssociation.contexts.WORKFLOW_INPUT,
                            resourceId: resourceId,
                            userId: workflow.userId,
                            projectId: project.id,
                            workflowId: workflow.id
                        };

                        ResourceAssociation.create(associationData).then(function (association) {
                            innerCallback();
                        }).catch(function (err) {
                            logger.error(err);
                            innerCallback()
                        });
                    });
                }, function (err) {
                    callback(err);
                });
            }
        ], function (err) {
            if(err){
                logger.error(err);
            }
            callback(err);
        })
    };

    this.deleteWorkflow = function (req, workflowId, cb ) {

        //kustuta töövoo ressursid
        //kustuta alamsammud
        //kustuta teenused
        //kustuta töövoog

        async.waterfall([
                function (callback) {

                    workflowDaoService.getWorkflow(workflowId, callback)
                },
                function deleteResources(workflow, callback) {

                    workflow.getResourceAssociations().then(function (associations) {

                        logger.debug( ' Got associations to delete: ' + associations.length );

                        async.eachSeries(associations, function (association, innerCb) {
                            resourceService.deleteAssociation( association, function (err) {
                                logger.debug('Association deleted');
                                innerCb(err);
                            });
                        }, function (err) {
                            callback(err, workflow);
                        });
                    });
                },
                function deleteWorkflow(workflow, callback) {

                    workflow.destroy().then(function () {
                        callback();
                    }).catch(function (err) {
                        callback(err.message);
                    });
                }
            ],
            function ( err, data) {
                if(err){
                    logger.error(err);
                }
                cb(err, data);
            }
        );
    };
}

module.exports = new WorkflowService();