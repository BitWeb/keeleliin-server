/**
 * Created by taivo on 15.06.15.
 */
var logger = require('log4js').getLogger('workflow_dao_service');
var async = require('async');
var Project = require(__base + 'src/service/dao/sql').Project;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var WorkflowDefinitionService = require(__base + 'src/service/dao/sql').WorkflowDefinitionService;

var Resource = require(__base + 'src/service/dao/sql').Resource;
var ServiceModel = require(__base + 'src/service/dao/sql').Service;
var User = require(__base + 'src/service/dao/sql').User;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var WorkflowServiceModel = require(__base + 'src/service/dao/sql').WorkflowService;
var ServiceParam = require(__base + 'src/service/dao/sql').ServiceParam;
var sequelize = require('sequelize');
var ArrayUtils = require(__base + 'src/util/arrayUtils');

function WorkflowDaoService() {

    var self = this;

    this.getWorkflow = function (id, cb) {
        Workflow.findById( id ).then(function (item) {
            if (!item) {
                return cb('Töövoogu ei leitud');
            }
            return cb(null, item);
        }).catch(cb);
    };

    this.getRunningWorkflows = function (cb) {

        Workflow.findAll({
            where: {
                status: Workflow.statusCodes.RUNNING
            }
        }).then(function (workflows) {
            return cb(null, workflows);
        }).catch(function (error) {
            return cb(error);
        });
    };

    this.getWorkflowOverview = function( workflowId, cb) {
        async.waterfall([
            function overviewQuery(callback) {

                Workflow.find({

                    attributes: [
                        'id',
                        'name',
                        'description',
                        'purpose',
                        'status',
                        'log',
                        'datetimeCreated',
                        'datetimeUpdated',
                        'datetimeStart',
                        'datetimeEnd',
                        'projectId'
                    ],
                    where: {
                        id: workflowId
                    },
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: [
                                'id',
                                'name',
                                'displaypicture'
                            ],
                            required: false
                        },
                        {
                            model: Resource,
                            as: 'inputResources',
                            attributes: [
                                'id',
                                'name',
                                'createdAt'
                            ],
                            required: false,
                            through:{
                                attributes:[]
                            }
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
                                    required: false,
                                    paranoid:false
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
                                            attributes: [
                                                'id',
                                                'name',
                                                'createdAt'
                                            ],
                                            required: false,
                                            through:{
                                                attributes:[]
                                            }
                                        },
                                        {
                                            model: Resource,
                                            as: 'outputResources',
                                            attributes: [
                                                'id',
                                                'name',
                                                'createdAt'
                                            ],
                                            required: false,
                                            through:{
                                                attributes:[]
                                            }
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

    this.getProjectWorkflowsList = function (projectId, callback) {

        Workflow.findAll({
            attributes: [
                'id',
                'name',
                'status',
                'datetimeCreated',
                'datetimeStart',
                'datetimeEnd'
            ],
            where: {
                projectId: projectId
            },
            order: 'datetime_created DESC',
            required: false,
            raw: false
        }).then(function (workflows) {
            return callback(null, workflows);
        }).catch(function (err) {
            return callback({
                message: err.message,
                code: 500
            });
        });
    };


    this.getWorkflowsManagementList = function ( params, callback) {

        var conditions = {
            attributes: [
                'id',
                'name',
                'status',
                'datetimeCreated',
                'datetimeStart',
                'datetimeEnd'
            ],
            where: {},
            include: [{
                model: User,
                as: 'user',
                attributes: [
                    'id',
                    'name',
                    'displaypicture',
                    'email'
                ],
                required: true
            }],
            orderBy: [['id', 'DESC']]
        };

        if(params.perPage){
            params.page = params.page ? params.page : 1;
            conditions.limit = params.perPage;
            if(params.page){
                conditions.offset = params.perPage * (params.page - 1);
            }
        }

        if(params.name){
            conditions.where.name = {
                $iLike: '%'+params.name+'%'
            }
        }

        if(params.status){
            conditions.where.status = params.status;
        }

        Workflow.findAndCountAll( conditions ).then(function (data) {
            callback(null, data);
        }).catch(function (err) {
            callback(err.message);
        });
    };
}

module.exports = new WorkflowDaoService();