/**
 * Created by taivo on 12.06.15.
 */

var logger = require('log4js').getLogger('workflow_service');

var async = require('async');
var projectService = require(__base + 'src/service/projectService');
var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
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

    this.canViewWorkflowById = function (req, workflowId, cb) {
        Workflow.findById(workflowId).then(function (workflow) {
            if(!workflow){
                cb(null, false);
            }
            projectService.canViewProjectById( req, workflow.projectId, function (err, success) {
                cb(err, success);
            });
        });
    };

    this.canEditWorkflowById = function (req, workflowId, cb) {
        Workflow.findById(workflowId).then(function (workflow) {
            if(!workflow){
                cb(null, false);
            }
            projectService.canEditProjectById( req, workflow.projectId, function (err, success) {
                cb(err, success);
            });
        });
    };

    this.getWorkflowOverview = function ( req, id, cb ) {

        async.waterfall([
                function (callback) {
                    self.canViewWorkflowById(req, id, function (err, canView) {
                        if(err){
                            return callback(err);
                        }
                        if(!canView){
                            return callback('Kasutajal puudub ligipääsuõigus');
                        }
                        callback();
                    });
                },
                function (callback) {
                    return workflowDaoService.getWorkflowOverview( id, {}, callback);
                },
                function (overview, callback) {
                    self.canEditWorkflowById(req, id, function (err, canEdit) {
                        if(err){
                            return callback(err);
                        }
                        overview = overview.toJSON();
                        overview.canEdit = canEdit;
                        callback(err, overview);

                    });
                },
                function (overview, callback) {
                    var definitionId = overview.workflowDefinitionId;
                    delete overview.workflowDefinitionId;

                    WorkflowDefinition.find({
                        where: {
                            id: definitionId
                        },
                        include: [{
                            model: User,
                            as: 'bookmarkedUsers',
                            where: {
                                id: req.redisSession.data.userId
                            },
                            required:false
                        }]
                    }).then(function (definition) {

                        if(!definition){
                            return callback(null, overview);
                        }

                        overview.workflowDefinition = {
                            id: definition.id,
                            isBookmarked: definition.bookmarkedUsers.length > 0
                        };
                        return callback(null, overview);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                }
            ],
            function (err, overview) {
                cb(err, overview);
            }
        );


        self.canViewWorkflowById(req, id, function (err, canView) {
            if(err){
                return callback(err);
            }
            if(!canView){
                return callback('Kasutajal puudub ligipääsuõigus');
            }

            return workflowDaoService.getWorkflowOverview( id, {}, function (err, overview) {
                self.canEditWorkflowById(req, id, function (err, canEdit) {
                    if(err){
                        return callback(err);
                    }
                    overview = overview.toJSON();
                    overview.canEdit = canEdit;
                    callback(err, overview);

                });
            });
        });
    };

    this.getWorkflowLog = function ( req, id, callback ) {
        self.canViewWorkflowById(req, id, function (err, canView) {
            if(err){
                return callback(err);
            }
            if(!canView){
                return callback('Kasutajal puudub ligipääsuõigus');
            }
            return workflowDaoService.getWorkflowOverview( id, {showLog: true}, function (err, overview) {
                if(err){
                    return callback(err);
                }

                if(overview.workflowServices){
                    for(var i = 0, iLength = overview.workflowServices.length; i < iLength; i++){
                        var service = overview.workflowServices[i];
                        if(service.subSteps){
                            for(var j = 0, jLength = service.subSteps.length; j < jLength; j++ ){
                                var substep = service.subSteps[j];
                                if(substep.log){
                                    substep.log = JSON.parse(substep.log);
                                }
                            }
                        }
                    }
                }

                callback(err, overview);
            });
        });
    };

    this.getWorkflowsDefinitionOverview = function ( req, workflowId, cb ) {

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

        self.canEditWorkflowById(req, workflowId, function (err, canView) {
            if(err){
               logger.error(err);
               return callback(err);
            }
            if(canView === false){
                return callback('Kasutajal ei ole õigust antud tövoogu käivitada');
            }

            workflowBuilder.create( workflowId, function (err, workflow) {
                if(err){
                    return callback( err );
                }

                var workflowRunner = new WorkflowRunner();
                workflowRunner.run(workflow.id, callback);
            });
        });
    };

    this.setWorkflowStatusCanceled = function (req, workflowId, cb) {
        async.waterfall([
            function ( callback ) {
                self.canEditWorkflowById(req, workflowId, function (err, canView) {
                    if(err){
                        logger.error(err);
                        return callback(err);
                    }
                    if(canView === false){
                        return callback('Kasutajal ei ole õigust antud tövoogu käivitada');
                    }
                    callback();
                });
            },
            function getWorkflow( callback ) {
                Workflow.findById( workflowId ).then(function (workflow) {
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

                        self._killWorkflowRunningSubSteps(req, workflow, function (err) {
                            logger.info('Signals sent', err);
                        });
                        callback(null, workflow);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                } else {
                    callback(null, workflow);
                }
            }
        ], function (err, workflow) {
            if(err){
                return cb( err );
            }
            self.getWorkflowOverview(req, workflowId, cb);
        });
    };

    this._killWorkflowRunningSubSteps = function ( req, workflow, cb ) {

        self.canEditWorkflowById(req, workflow.id, function (err, canView) {
            if(err){
                logger.error(err);
                return cb(err);
            }

            if(canView === false){
                return cb('Kasutajal ei ole õigust antud tövoogu käivitada');
            }

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
        });
    };


    this.getProjectWorkflowsList = function(req, projectId, cb) {

        async.waterfall([
                function (callback) {
                    projectService.canViewProjectById(req, projectId, function (err, success) {
                        if(err || !success){
                            return callback('Kasutajal ei ole õigust antud projekti töövooge näha');
                        }
                        callback();
                    });
                },
                function (callback) {
                    workflowDaoService.getProjectWorkflowsList(projectId, req.redisSession.data.userId, function (err, workflows) {
                        callback(err, workflows);
                    });
                },
                function (workflows, callback) {
                    var result = [];
                    async.eachSeries(workflows, function (item, innerCb) {
                        item = ObjectUtil.snakeToCame( item );
                        Workflow.build({id: item.id, status: item.status }).getProgress(function (err, progress) {
                            item.progress = progress;
                            item.workflowDefinition = {
                                id: item.workflowDefinitionId,
                                isBookmarked: item.isDefinitionBookmarked
                            };
                            delete item.workflowDefinitionId;
                            delete item.isDefinitionBookmarked;
                            result.push( item );
                            innerCb(err);
                        });
                    }, function (err) {
                        callback(err, result);
                    });
                }
            ],
            function (err, result) {
                if(err){
                   logger.error(err);
                }
                cb(err, result);
            }
        );
    };

    this.getWorkflowsManagementList = function (req, params, cb) {

        async.waterfall([

                function (callback) {
                    workflowDaoService.getWorkflowsManagementList( params, callback );
                },
                function (data, callback) {
                    async.forEachOf(
                        data.rows,
                        function (row, key, innerCb) {
                            data.rows[key] = ObjectUtil.snakeToCame(row);

                            Workflow.build({id: row.id, status: row.status}).getProgress(function (err, progress) {
                                data.rows[key].progress = progress;
                                innerCb(err);
                            });
                        },
                        function (err) {
                            callback(err, data);
                        }
                    );
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

    this.deleteWorkflow = function (req, workflowId, cb ) {

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