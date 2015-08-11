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
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var WorkflowServiceModel = require(__base + 'src/service/dao/sql').WorkflowService;
var ServiceModel = require(__base + 'src/service/dao/sql').Service;
var ArrayUtils = require(__base + 'src/util/arrayUtils');

function WorkflowService() {

    var self = this;

    this.getWorkflowOverview = function(req, workflowId, cb) {


        async.waterfall([
            function overviewQuery(callback) {

                Workflow.find({
                    as: 'workflow',
                    attributes: [
                        'id',
                        'name',
                        'description',
                        'status',
                        'datetimeCreated',
                        'datetimeStart',
                        'datetimeEnd',
                        'projectId'
                    ],
                    where: {
                        id: workflowId
                    },
                    include: [
                        {
                            model: Resource,
                            as: 'inputResources',
                            attributes: [
                                'id',
                                'name',
                                'fileType',
                                'createdAt'
                            ],
                            required: false
                        }, {
                            model: WorkflowServiceModel,
                            as: 'workflowServices',
                            attributes: [
                                'id',
                                'status',
                                'orderNum',
                                'log',
                                'datetimeStart',
                                'datetimeEnd'
                            ],
                            where: {},
                            required: false,
                            include: [
                                {
                                    model: ServiceModel,
                                    as: 'service',
                                    attributes: [
                                        'id',
                                        'name'
                                    ],
                                    required: false
                                },
                                {
                                    model: WorkflowServiceSubstep,
                                    as: 'subSteps',
                                    attributes: [
                                        'id',
                                        'status',
                                        'log',
                                        'datetimeStart',
                                        'datetimeEnd'
                                    ],
                                    where: {},
                                    required: false,
                                    include: [
                                        {
                                            model: Resource,
                                            as: 'inputResources',
                                            where: {},
                                            attributes: [
                                                'id',
                                                'name',
                                                'fileType',
                                                'createdAt'],
                                            required: false
                                        },
                                        {
                                            model: Resource,
                                            as: 'outputResources',
                                            where: {},
                                            attributes: [
                                                'id',
                                                'name',
                                                'fileType',
                                                'createdAt'
                                            ],
                                            required: false
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }).then(function (item) {
                    if (!item) {
                        return callback('Töövoogu ei leitud');
                    }
                    return callback(null, item);
                }).catch(function (err) {
                    logger.error(err);
                    callback(err);
                });
            },
            function sortServices(overview, callback) {

                overview.workflowServices = ArrayUtils.sort(overview.workflowServices, 'orderNum');
                callback(null, overview)
            }
        ], function (err, overview) {
            cb(err, overview);
        });
    };

    this.getWorkflowsRunning = function(cb) {

        Workflow.findAll({
            where: {
                status: Workflow.statusCodes.RUNNING
            }
        }).then(function(workflows) {
            return cb(null, workflows);
        }).catch(function(error) {
            return cb(error);
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
            }
        ], function (err, workflow) {
            if(err){
                return cb(err);
            }
            self.getWorkflowOverview(req, workflowId, cb);
        });
    };

    this.getWorkflowServiceParamValues = function(req, workflowServiceId, callback) {
        return workflowDaoService.findWorkflowServiceParamValues(workflowServiceId, callback);
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

                    var dtoItem = {
                        id: item.id,
                        name: item.name,
                        status: item.status,
                        datetimeCreated: item.datetimeCreated,
                        datetimeStart: item.datetimeStart,
                        datetimeEnd: item.datetimeEnd,
                        progress: (item.workflowServices.filter(function(value){return value.status == 'FINISHED';}).length * 100) / item.workflowServices.length
                    };
                    dto.push(dtoItem);
                }
                return callback(err, dto);
            });
        });

    };


}

module.exports = new WorkflowService();