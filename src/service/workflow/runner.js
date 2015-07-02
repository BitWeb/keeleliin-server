/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('workflow_runner');
var async = require('async');

var config = require(__base + 'config');

var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var WorkflowService = require(__base + 'src/service/dao/sql').WorkflowService;
var Resource = require(__base + 'src/service/dao/sql').Resource;

var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');



var substepRunner = require('./substep/substepRunner');



function Runner(){
    var self = this;

    var workflow;
    var workflowServices;

    //Käivita töövoo
    this.run = function (workflowId, cb) {
        logger.debug('Run workflow id: '  + workflowId);
        async.waterfall([
            function (callback) {
                self._getWorkflow(workflowId, callback);
            },
            function (callback) {
                self._checkStatusForRun(callback);
            },
            function (callback) {
                self._startWorkflow(callback);
            }
        ], function (err) {
            if(err){
                logger.error(err);
                return cb(err);
            }
            return cb(null, workflow);
        });
    };

    this.check = function (workflowId, cb) {

        Workflow.find({
            as: 'workflow',
            where: {
                id: workflowId
            },
            include: [
                {
                    model: Resource,
                    as: 'inputResources',
                    attributes: ['id','name', 'file_type', 'date_created']

                },{
                    model: WorkflowService,
                    as: 'workflowServices',
                    where: {},
                    include: [
                        {
                            model: WorkflowServiceSubstep,
                            as: 'subSteps',
                            where: {},
                            include: [
                                {
                                    model: Resource,
                                    as: 'inputResources',
                                    where: {},
                                    attributes: ['id','name', 'file_type', 'date_created']
                                },
                                {
                                    model: Resource,
                                    as: 'outputResources',
                                    where: {},
                                    attributes: ['id','name', 'file_type', 'date_created']
                                }
                            ]
                        }
                    ]
                }
            ]
        }).then(function (item) {

            logger.error(item);

            if(!item){
                return cb('Töövoogu ei leitud');
            }
            cb(null, item)
        }).catch(function (err) {
            logger.error(err);
            cb(err);
        });
    };

    this._getWorkflow = function (id, cb) {
        workflowDaoService.getWorkflow(id, function(err, item){
            if(err){
                return cb(err);
            }
            workflow = item;
            cb();
        });
    };

    this._checkStatusForRun = function(cb){
        if(workflow.status != Workflow.statusCodes.INIT){
            return cb('Antud töövoo ühik on juba varem käivitatud');
        }
        return cb()
    };

    this._startWorkflow = function (cb) {

        workflow.status = Workflow.statusCodes.RUNNING;
        workflow.datetime_start = new Date();

        workflow.save().then(function (updatedWorkflow) {
            workflow = updatedWorkflow;

            cb(null, workflow); // return to user

            self._startHandleServices();
        }).catch(function (err) {
            cb(err);
        });
    };

    this._startHandleServices = function(){
        logger.error('handleServices');

        //
        workflow.getWorkflowServices({order: [['order_num', 'ASC']]}).then(function (data) {
            workflowServices = data;
            logger.error(workflowServices);
            self._handleFirstWorkflowService();
        }).catch(function (err) {
            self.finishWorkflow( Workflow.statusCodes.ERROR, function (err, item) {});
        });
    };

    this._handleFirstWorkflowService = function(){
        logger.debug('Handle first');
        var workflowService = workflowServices[0];
        if(!workflowService){
            logger.info('No service to handle on index' + 0);
            return self.finishWorkflow(Workflow.statusCodes.FINISHED, function () {});
        }

        workflowService.order_num = 0;

        self.startWorkflowService(workflowService, function (err, workflowService) {
            workflow.getInputResources().then(function (resources) {
                logger.debug('Start handle first resources');
                self._handleWorkflowServiceResources(resources, workflowService, null);
            }).catch(function (err) {
                logger.error(err);
            });
        });
    };


    this.startWorkflowService = function (workflowService, cb) {
        if(workflowService.status == WorkflowService.statusCodes.INIT){
            workflowService.status = WorkflowService.statusCodes.RUNNING;
            workflowService.datetime_start = new Date();

            return workflowService.save().then(function (workflowService) {
                cb(null, workflowService);
            }).catch(cb);

        } else if(workflowService.status == WorkflowService.statusCodes.ERROR){

            return cb('Töövoos on tekkinud viga');
        }

        logger.debug('Workflow already started');
        cb(null, workflowService);
    };

    this.finishWorkflowService = function (workflowService,status, cb) {

        if(workflowService.status =! WorkflowService.statusCodes.ERROR){
            workflowService.status = status;
            workflowService.datetime_end = new Date();
        }

        workflowService.save().then(function (workflowService) {
            cb(null, workflowService);
        }).catch(cb);
    };
/********/
    this._handleWorkflowServiceResources = function ( resources, workflowService, previousStep ) {

        logger.error('_handleWorkflowServiceResources' + resources.length + ' ' + workflowService.id);


        //todo: eeldatakse, et kõik sisendressursid on ühte tüüpi ja sobivad teenusele
        async.each(
            resources,
            function (resource, callback) {
                self._makeWorkflowServiceSubStep(resource, workflowService, previousStep, function (err, substep) {
                    self._runSubstep(substep);
                    callback();
                });
            },
            function (err) {
                if(err){
                    logger.error('_handleFirstWorkflowServiceResources');
                    logger.error(err);
                    return false;
                }
                logger.info('Service handle started');
            }
        );
    };


    this._makeWorkflowServiceSubStep = function ( resource, workflowService, previousStep, cb) {

        var substepData = {
            workflow_service_id: workflowService.id,
            prev_substep_id: null,
            status: 'INIT',
            index: 0
        };

        if(previousStep){
            substepData.prev_substep_id = previousStep.id
        }

        WorkflowServiceSubstep.build(substepData).save().then(function (substep){
            substep.addInputResource(resource).then(function (){
                cb(null, substep);
            }).catch(function (err) {
                logger.error('Add resource error');
                logger.error(err);
            });
        }).catch(function (err) {
            logger.error('Save step error');
            logger.error(err);
        });
    };

    this._runSubstep = function (substep) {

        substepRunner.run(substep, function(err, substep){
            logger.info('Substep is finishe running: ' + substep.id + ' status: ' + substep.status);
            self._continueRunFromSubstep( substep );
        });
    };

    this._continueRunFromSubstep = function (substep) {

        substep.getWorkflowService().then(function (workflowService) {
            var orderNum = workflowService.order_num;
            var nextOrderNum = orderNum + 1;
            var nextWorkflowService =  workflowServices[nextOrderNum];

            if(nextWorkflowService){
                nextWorkflowService.order_num = nextOrderNum;
                self._handleWorkflowService(nextWorkflowService, substep);
            } else {
                self.tryToCloseWorkflowService(workflowService, function () {


                    logger.error('No next nextWorkflowService. Tried to close id: ' + workflowService.id);
                });
            }
        });
    };

    this._handleWorkflowService = function (workflowService, fromSubstep) {

        async.waterfall([
            function checkPast(callback){
                fromSubstep.getWorkflowService().then(function (fromWorkflowService) {
                    self.tryToCloseWorkflowService(fromWorkflowService, callback);
                });
            },
            function startWfService(callback) {
                self.startWorkflowService(workflowService, callback);
            },
            function handleFromSubstepOutputResources(workflowService, callback) {
                fromSubstep.getOutputResources().then(function (resources) {
                    self._handleWorkflowServiceResources(resources, workflowService, fromSubstep);
                    callback();
                });
            }
        ], function (err) {
            logger.info('workflow service '+ workflowService +' handling started from substep ' + fromSubstep.id);
        });
    };

    this.tryToCloseWorkflowService = function (workflowService, cb) {

        logger.error('ORDER NUM' + workflowService.order_num + ' ID:' + workflowService.id);


        ///
        WorkflowService.count({
            where: {
                workflow_id: workflowService.workflow_id,
                status: {
                    ne: WorkflowServiceSubstep.statusCodes.FINISHED
                },
                order_num:{
                    lte: workflowService.order_num
                }
            }
        }).then(function (notClosedCount) {
            logger.error('BEFORE1');
            logger.error(notClosedCount);
        });

        //kas kõik selle ja eelnevate teenusele sammud on lõpetanud
        WorkflowServiceSubstep.count({
            where: {
                status: {
                    ne: WorkflowServiceSubstep.statusCodes.FINISHED
                }
            },
            include: [{
                model: WorkflowService,
                as: 'workflowService',
                required: true,
                where: {
                    workflow_id: workflowService.workflow_id,
                    order_num:{
                        lte: workflowService.order_num
                    }
                }
            }]
        }).then(function (notClosedCount) {
            logger.error('BEFORE2');
            logger.error(notClosedCount);
        });







        cb();
    };
//************
    self.finishWorkflow = function (status, cb) {
        workflow.status = status;
        workflow.datetime_end = new Date();
        workflow.save().then(function (updatedWorkflow) {
            workflow = updatedWorkflow;
            logger.info('Workflow id:'+updatedWorkflow.id+' finished with status: ' + workflow.status);
            cb(null, workflow);
        }).catch(function (err) {
            cb(err);
        });
    }
}

module.exports = Runner;