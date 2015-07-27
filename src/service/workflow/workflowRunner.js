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
var resourceHandler = require('./resource/resourceHandler');
var StatusHolder = require('./statusHolder');

function Runner() {
    var self = this;

    var workflow;
    var workflowServices;
    var statusHolder = new StatusHolder();

    this.run = function (workflowId, cb) {
        logger.debug('Run workflow id: ' + workflowId);
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
            if (err) {
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
                    attributes: ['id', 'name', 'file_type', 'date_created'],
                    required: false
                }, {
                    model: WorkflowService,
                    as: 'workflowServices',
                    where: {},
                    required: false,
                    include: [
                        {
                            model: WorkflowServiceSubstep,
                            as: 'subSteps',
                            where: {},
                            required: false,
                            include: [
                                {
                                    model: Resource,
                                    as: 'inputResources',
                                    where: {},
                                    attributes: ['id', 'name', 'file_type', 'date_created'],
                                    required: false
                                },
                                {
                                    model: Resource,
                                    as: 'outputResources',
                                    where: {},
                                    attributes: ['id', 'name', 'file_type', 'date_created'],
                                    required: false
                                }
                            ]
                        }
                    ]
                }
            ]
        }).then(function (item) {
            if (!item) {
                return cb('Töövoogu ei leitud');
            }
            cb(null, item)
        }).catch(function (err) {
            logger.error(err);
            cb(err);
        });
    };

    this._getWorkflow = function (id, cb) {
        workflowDaoService.getWorkflow(id, function (err, item) {
            if (err) {
                return cb(err);
            }
            workflow = item;
            cb();
        });
    };

    this._checkStatusForRun = function (cb) {
        if (workflow.status != Workflow.statusCodes.INIT) {
            return cb('Antud töövoog on juba varem käivitatud');
        }
        return cb()
    };

    this._startWorkflow = function (cb) {

        workflow.status = Workflow.statusCodes.RUNNING;
        workflow.datetime_start = new Date();

        workflow.save().then(function () {
            logger.debug('Return to user');
            cb(null, workflow); // return to user and continue async
            logger.debug('Continue with running workflow');
            self._startHandleServices();
        }).catch(function (err) {
            cb(err);
        });
    };

    this._startHandleServices = function () {

        logger.debug('Handle services');

        workflow.getWorkflowServices({order: [['order_num', 'ASC']]}).then(function (data) {
            workflowServices = data;
            logger.debug('Got ' + workflowServices.length + ' workflow service');

            if(workflowServices.length == 0){
                logger.debug('No service to handle on index 0. Finish workflow');
                return self.finishWorkflow(Workflow.statusCodes.FINISHED, function () {});
            }

            self._continueFromSubStep( null, function (err) {

            } );
        }).catch(function (err) {
            self.finishWorkflow(Workflow.statusCodes.ERROR, function (err, item) {
            });
        });
    };

    this._continueFromSubStep = function (fromSubStep, cb) {

        logger.debug('Continue from substep id: ' + (fromSubStep != undefined ? fromSubStep.id: null));


        async.waterfall([
            function isFirst(callback) {
                if (fromSubStep == null) {
                    var workflowService = workflowServices[0];
                    workflowService.order_num = 0;
                    return self._handleWorkflowService(workflowService, null, cb);
                } else {
                    return callback();
                }
            },
            function getPreviousWorkflowService(callback) {
                fromSubStep.getWorkflowService().then(function (previousWorkflowService) {
                    callback(null, previousWorkflowService);
                });
            },
            function getNextWorkflowService(previousWorkflowService, callback) {

                var nextOrderNum = previousWorkflowService.order_num + 1;
                var workflowService = workflowServices[nextOrderNum];

                if (workflowService) {
                    workflowService.order_num = nextOrderNum;
                    return self._handleWorkflowService(workflowService, fromSubStep, cb);
                }
                cb();
            }
        ]);
    };

    this._handleWorkflowService = function (workflowService, fromSubStep, cb) {

        async.waterfall([
            function startWfService(callback) {
                self.startWorkflowService(workflowService, callback);
            },
            function getResources(callback) {
                if(fromSubStep){
                    fromSubStep.getOutputResources().then(function (resources) {
                        callback(null, resources);
                    });
                } else {
                    workflow.getInputResources().then(function (resources) {
                        logger.debug('Start handle first service resources');
                        callback(null, resources);
                    }).catch(function (err) {
                        logger.error(err);
                        callback(err);
                    });
                }
            },
            function setResourcesToHandle(resources, callback) {
                statusHolder.updateFilesToParseCount(workflowService, resources.length);
                callback(null, resources);
            },
            function handleInputResources(resources, callback) {
                self._handleInputResources(resources, workflowService, fromSubStep, callback);
            }
        ], function (err) {
            logger.info('workflow service ' + workflowService + ' handling started from sub step ' + (fromSubStep != undefined ? fromSubStep.id : null));
            if (err) {
                logger.error(err);
                workflowService.log = err;
                self.finishWorkflowService(workflowService, WorkflowService.statusCodes.ERROR, function (err) {
                    logger.debug('WorkflowService finished with error: ' + err);
                });
            }
            cb(); //Do not finish previous service before output is given over.
        });
    };

    this._handleInputResources = function (resources, workflowService, fromSubStep, cb) {

        async.waterfall([
            function (callback) {
                resourceHandler.getWorkflowServiceSubStepsInputResources(
                    resources,
                    workflowService,
                    function handleSubResource(err, resource) {
                        if(err){
                            logger.error(err);
                            return;
                        }
                        logger.debug('Got to handle sub input resource id: ' + resource.id);
                        statusHolder.updateSubStepsToRunCount(workflowService, 1);
                        self._makeWorkflowServiceSubStep(resource, workflowService, fromSubStep, function (err, subStep) {
                            logger.debug('Start running subStep id: ' + subStep);
                            self._runSubStep(subStep, workflowService);
                            return callback();
                        });
                    },
                    function resourcesTraversed(err) {
                        logger.debug('Workflow service resources traversed');
                        if(err){
                            return callback(err);
                        }
                        statusHolder.updateFilesToParseCount(workflowService, (resources.length*(-1)));
                        return callback();
                    }
                );
            }
        ], function (err) {
            cb( err );
        });
    };

    this.startWorkflowService = function (workflowService, cb) {

        if (workflowService.status == WorkflowService.statusCodes.INIT) {
            workflowService.status = WorkflowService.statusCodes.RUNNING;
            workflowService.datetime_start = new Date();

            return workflowService.save().then(function () {
                cb(null);
            }).catch(cb);

        } else if (workflowService.status == WorkflowService.statusCodes.ERROR) {
            return cb('Töövoos on tekkinud viga');
        } else if (workflowService.status == WorkflowService.statusCodes.RUNNING) {
            logger.debug('Workflow already started');
            cb(null);
        } else {
            return cb('Töövoos staatus käivitamisel oli: ' + workflowService.status + '. TODO ');
        }
    };

    this._makeWorkflowServiceSubStep = function (resource, workflowService, previousStep, cb) {

        var subStepData = {
            workflow_service_id: workflowService.id,
            prev_substep_id: null,
            status: 'INIT',
            index: 0
        };

        if (previousStep) {
            subStepData.prev_substep_id = previousStep.id
        }

        WorkflowServiceSubstep.build(subStepData).save().then(function (subStep) {
            subStep.addInputResource(resource).then(function () {
                cb(null, subStep);
            }).catch(function (err) {
                logger.error('Add resource error', err);
                cb(err.message);
            });
        }).catch(function (err) {
            logger.error('SubStep build error', err);
            cb(err.message);
        });
    };

    this._runSubStep = function (subStep, workflowService) {

        substepRunner.run(subStep, function (err, subStep) {
            logger.info('Substep is finished running: ' + subStep.id + ' status: ' + subStep.status);

            statusHolder.updateSubStepsToRunCount(workflowService, -1);
            if (err || subStep.status != WorkflowServiceSubstep.statusCodes.FINISHED) {
                logger.debug('Break substep: ' + subStep.id);
                return self._breakFromSubstep(subStep);
            }

            logger.debug('Continue substep: ' + subStep.id);

            return self._continueFromSubStep(subStep, function (err) {
                self.tryToFinishWorkflowService(workflowService, function (err, success) {
                    logger.info('Tried to close id: ' + workflowService.id + ' Success: ' + success);
                    if(success == true){
                        self.tryToFinishWorkflow(function () {
                            logger.debug('Tried to finish workflow id: ' + workflow.id + ' Status: ' + workflow.status);
                        });
                    }
                });
            });
        });
    };



    this._breakFromSubstep = function (subStep) {

        async.waterfall([
            function (callback) {
                subStep.getWorkflowService().then(function (workflowService) {
                    callback(null, workflowService);
                });
            },
            function (workflowService, callback) {
                self.finishWorkflowService(workflowService, WorkflowService.statusCodes.ERROR, function (err) {
                    callback(err);
                });
            }
        ], function (err) {
            if (err) {
                return logger.error(err);
            }
            logger.error('SubStep id: ' + subStep.id + ' breaked workflow.');
        });
    };

    this.tryToFinishWorkflowService = function (workflowService, cb) {

        logger.debug('Order num:' + workflowService.order_num + ' ID:' + workflowService.id);

        async.waterfall([
            function isSomethingInProcess(callback) {
                if(statusHolder.isInProcessing(workflowService)){
                    logger.debug('Cannot finish. Something is in process');
                    return cb(null, false);
                } else {
                    logger.debug('Processing is finished');
                    return callback();
                }
            },
            function isEarlierServicesAllFinished(callback) {

                WorkflowService.count({
                    where: {
                        workflow_id: workflowService.workflow_id,
                        status: {
                            ne: WorkflowService.statusCodes.FINISHED
                        },
                        order_num: {
                            lt: workflowService.order_num
                        }
                    }
                }).then(function (notClosedCount) {
                    logger.debug('Not closed services before: ' + notClosedCount);
                    if (notClosedCount > 0) {
                        return cb(null, false);
                    }

                    callback();
                }).catch(function (err) {
                    callback(err.message);
                });
            },
            function areCurrentServiceAllStepsFinished(callback) {

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
                            order_num: {
                                lte: workflowService.order_num
                            }
                        }
                    }]
                }).then(function (notClosedStepCount) {

                    logger.debug('Not closed steps in current: ' + notClosedStepCount);

                    if (notClosedStepCount > 0) {
                        return cb(null, false);
                    }

                    callback();
                }).catch(function (err) {
                    callback(err.message);
                });
            }
        ], function (err) {

            if (err) {
                workflowService.log = err;
                return self.finishWorkflowService(workflowService, WorkflowService.statusCodes.ERROR, cb);
            }

            self.finishWorkflowService(workflowService, WorkflowService.statusCodes.FINISHED, cb);
        });
    };

    this.finishWorkflowService = function (workflowService, status, cb) {
        logger.info('Set service status ' + status);

        if (workflowService.status != WorkflowService.statusCodes.ERROR) {
            workflowService.status = status;
            workflowService.datetime_end = new Date();
        }

        workflowService.save().then(function () {

            if (workflowService.status == WorkflowService.statusCodes.ERROR) {
                self.finishWorkflow(Workflow.statusCodes.ERROR, function (err) {
                    cb(null, true);
                });
            } else {
                cb(null, true);
            }
        }).catch(function (err) {
            cb(err.message);
        });
    };

    this.tryToFinishWorkflow = function (cb) {

        async.waterfall([
            function areThereAnyErrorsBefore(callback) {
                WorkflowService.count({
                    where: {
                        workflow_id: workflow.id,
                        status: WorkflowService.statusCodes.ERROR
                    }
                }).then(function (errorsCount) {
                    logger.debug('Services with errors: ' + errorsCount);
                    if (errorsCount > 0) {
                        return self.finishWorkflow(Workflow.statusCodes.ERROR, cb); //Finish with error
                    }
                    callback();
                }).catch(cb);
            },
            function areThereAnyNotFinishedServices(callback) {
                WorkflowService.count({
                    where: {
                        workflow_id: workflow.id,
                        status: {
                            in: [WorkflowService.statusCodes.INIT, WorkflowService.statusCodes.RUNNING]
                        }
                    }
                }).then(function (notFinishedCount) {
                    logger.debug('Not finished count: ' + notFinishedCount);

                    if (notFinishedCount > 0) {
                        return cb();
                    }

                    callback();
                }).catch(cb);
            }
        ], function (err) {

            if (err) {
                return self.finishWorkflow(Workflow.statusCodes.ERROR, cb);
            }
            return self.finishWorkflow(Workflow.statusCodes.FINISHED, cb);
        })
    };

    this.finishWorkflow = function (status, cb) {
        logger.debug('Set workflow status: ' + status);

        workflow.status = status;
        workflow.datetime_end = new Date();
        workflow.save().then(function () {
            logger.info('Workflow id:' + workflow.id + ' finished with status: ' + workflow.status);
            cb(null, workflow);
        }).catch(function (err) {
            cb(err);
        });
    }
}

module.exports = Runner;