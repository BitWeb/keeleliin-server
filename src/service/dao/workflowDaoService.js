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
var sequelize = require(__base + 'src/service/dao/sql').sequelize;
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

    this.getWorkflowOverview = function( workflowId, options, cb) {

        var subStepAttributes = [
            'id',
            'status',
            'errorLog',
            'datetimeStart',
            'datetimeEnd'
        ];

        if(options.showLog){
            subStepAttributes.push('log');
        }

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
                        'projectId',
                        'workflowDefinitionId'
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
                                    attributes: subStepAttributes,
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
            logger.error('Error: ', err);
            return callback( err.message );
        });
    };


    this.getWorkflowsManagementList = function ( params, cb) {

        //'name_asc','name_desc','created_at_asc','created_at_desc'


        var where = '';

        if(params.name && params.status){
            where = " WHERE wf.name ILIKE '%" + params.name + "%' AND  wf.status = '" + params.status + "' ";
        } else if( params.name ){
            where = " WHERE wf.name ILIKE '%" + params.name + "%' ";
        } else if( params.status ){
            where = " WHERE wf.status = '" + params.status + "' ";
        }

        var limits = "";
        if( params.page && params.perPage ){
            limits = " LIMIT " + params.perPage + " OFFSET " + ((params.page - 1) * params.perPage);
        }

        var countQuery = " SELECT " +
            " COUNT(wf.id) as total_count" +
            " FROM workflow as wf " + where + " ;";

        var order;
        if(params.order == 'name_asc'){
            order = " wf.name ASC ";
        } else if(params.order == 'name_desc'){
            order = " wf.name DESC ";
        } else if(params.order == 'created_at_asc'){
            order = " wf.datetime_created ASC ";
        } else if(params.order == 'created_at_desc'){
            order = " wf.datetime_created DESC ";
        } else {
            order = " wf.name ASC ";
        }

        var query = " SELECT " +
            " wf.id, " +
            " wf.name, " +
            " wf.status, " +
            " wf.datetime_created, " +
            " wf.datetime_start, " +
            " wf.datetime_end, " +
            " u.id as user_id, " +
            " u.name as user_name, " +
            " u.email as user_email" +
            " FROM workflow AS wf " +
            " JOIN \"user\" AS u ON (wf.user_id = u.id) " +
            where +
            " GROUP BY wf.id, u.id ORDER BY " + order + " " + limits
            ;

        var result = {
            count: 0,
            rows: []
        };

        sequelize.query(countQuery, {
            replacements: {/*projectId: projectId*/},
            type: sequelize.QueryTypes.SELECT
        }).then(function (countResult) {
            result.count = countResult.pop().total_count;
            sequelize.query(query, {
                replacements: {/*projectId: projectId*/},
                type: sequelize.QueryTypes.SELECT
            }).then(function (workflowDefinitions) {
                result.rows = workflowDefinitions;
                return cb(null, result);
            }).catch(function (err) {
                logger.error(err);
                return cb(err.message);
            });
        }).catch(function (err) {
            logger.error(err);
            return cb(err.message);
        });
    };
}

module.exports = new WorkflowDaoService();