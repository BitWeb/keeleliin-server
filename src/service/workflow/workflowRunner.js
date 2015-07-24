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

function Runner() {
    var self = this;

    var workflow;
    var workflowServices;



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
            return cb('Antud töövoo ühik on juba varem käivitatud');
        }
        return cb()
    };

    this._startWorkflow = function (cb) {

        workflow.status = Workflow.statusCodes.RUNNING;
        workflow.datetime_start = new Date();

        workflow.save().then(function (updatedWorkflow) {
            workflow = updatedWorkflow;
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
            self._handleFirstWorkflowService();
        }).catch(function (err) {
            self.finishWorkflow(Workflow.statusCodes.ERROR, function (err, item) {
            });
        });
    };

    this._handleFirstWorkflowService = function () {

        logger.debug('Handle first service');
        var workflowService = workflowServices[0];
        if (!workflowService) {
            logger.debug('No service to handle on index 0. Finish workflow');
            return self.finishWorkflow(Workflow.statusCodes.FINISHED, function () {
            });
        }

        workflowService.order_num = 0;

        async.waterfall([
            function startWorkflow(callback) {
                self.startWorkflowService(workflowService, function (err, workflowService) {
                    callback(err);
                });
            },
            function getWorkflowInputResources(callback) {
                workflow.getInputResources().then(function (resources) {
                    logger.debug('Start handle first service resources');
                    callback(null, resources);
                }).catch(function (err) {
                    logger.error(err);
                    callback(err);
                });
            },
            function (resources, callback) {
                logger.debug('Handle input resources');

                resourceHandler.getWorkflowServiceSubstepsInputResources(
                    resources,
                    workflowService,
                    function (err, resource) {
                        if(err){ return callback(err); }
                        logger.debug('Handle input resource id: ' + resource.id);
                        self._handleWorkflowServiceInputResource(resource, workflowService, null);
                    },
                    function (err) {
                        if(err){ return callback(err); }
                        logger.debug('Workflow service resources traversed');
                        callback(err);
                    }
                );
            }
        ], function (err) {
            if (err) {
                logger.error(err);
                self.finishWorkflowService(workflowService, WorkflowService.statusCodes.ERROR, function (err) {
                    logger.debug('WorkflowService finished with error: ' + err);
                });
            }
        });
    };


    this.startWorkflowService = function (workflowService, cb) {
        if (workflowService.status == WorkflowService.statusCodes.INIT) {
            workflowService.status = WorkflowService.statusCodes.RUNNING;
            workflowService.datetime_start = new Date();

            return workflowService.save().then(function (workflowService) {
                cb(null, workflowService);
            }).catch(cb);

        } else if (workflowService.status == WorkflowService.statusCodes.ERROR) {

            return cb('Töövoos on tekkinud viga');
        }

        logger.debug('Workflow already started');
        cb(null, workflowService);
    };

    this._handleWorkflowServiceInputResource = function (resource, workflowService, previousStep) {

        logger.debug('Handle workflow service resource. Service id: ' + workflowService.id);

        self._makeWorkflowServiceSubStep(resource, workflowService, previousStep, function (err, substep) {
            self._runSubstep(substep);
        });
    };

    this._makeWorkflowServiceSubStep = function (resource, workflowService, previousStep, cb) {

        var substepData = {
            workflow_service_id: workflowService.id,
            prev_substep_id: null,
            status: 'INIT',
            index: 0
        };

        if (previousStep) {
            substepData.prev_substep_id = previousStep.id
        }

        WorkflowServiceSubstep.build(substepData).save().then(function (substep) {
            substep.addInputResource(resource).then(function () {
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

        substepRunner.run(substep, function (err, substep) {
            logger.info('Substep is finishe running: ' + substep.id + ' status: ' + substep.status);

            if (err || substep.status != WorkflowServiceSubstep.statusCodes.FINISHED) {
                return self._breakFromSubstep(substep);
            }
            //can continue
            return self._continueRunFromSubstep(substep);
        });
    };

    this._continueRunFromSubstep = function (substep) {

        substep.getWorkflowService().then(function (workflowService) {
            var orderNum = workflowService.order_num;
            var nextOrderNum = orderNum + 1;
            var nextWorkflowService = workflowServices[nextOrderNum];

            if (nextWorkflowService) {
                nextWorkflowService.order_num = nextOrderNum;
                self._handleWorkflowService(nextWorkflowService, substep);
            } else {
                self.tryToFinishWorkflowService(workflowService, function () {
                    logger.info('No next nextWorkflowService. Tried to close id: ' + workflowService.id);

                    self.tryToFinishWorkflow(function () {
                        logger.debug('Tried to finish workflow id: ' + workflow.id + ' Status: ' + workflow.status);
                    });

                });
            }
        });
    };

    this._breakFromSubstep = function (substep) {

        async.waterfall([
            function (callback) {
                substep.getWorkflowService().then(function (workflowService) {
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
            logger.error('Substep id: ' + substep.id + ' breaked workflow.');
        });
    };

    this._handleWorkflowService = function (workflowService, fromSubstep) {

        async.waterfall([
            function checkPast(callback) {
                fromSubstep.getWorkflowService().then(function (fromWorkflowService) {
                    self.tryToFinishWorkflowService(fromWorkflowService, function (err) {
                        if (err) {
                            logger.error('Got Error');
                            logger.error(err);
                        }
                        callback();
                    });
                });
            },
            function startWfService(callback) {
                self.startWorkflowService(workflowService, callback);
            },
            function handleFromSubstepOutputResources(workflowService, callback) {
                fromSubstep.getOutputResources().then(function (resources) {
                    callback(null, resources);
                });
            }, function (resources, callback) {

                resourceHandler.getWorkflowServiceSubstepsInputResources(
                    resources,
                    workflowService,
                    function (err, resource) {
                        if(err){
                            logger.error(err);
                            return;
                        }
                        logger.debug('Handle input resource id: ' + resource.id);
                        self._handleWorkflowServiceInputResource(resource, workflowService, fromSubstep);
                    },
                    function (err) {
                        logger.debug('Workflow service resources traversed');
                        callback(err);
                    }
                );
            }
        ], function (err) {
            logger.info('workflow service ' + workflowService + ' handling started from substep ' + fromSubstep.id);
        });
    };

    this.tryToFinishWorkflowService = function (workflowService, cb) {

        logger.debug('Order num:' + workflowService.order_num + ' ID:' + workflowService.id);

        async.waterfall([
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
                        return cb();
                    }

                    callback();
                }).catch(cb);
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
                        return cb();
                    }

                    callback();
                }).catch(cb);
            },
            function isThereDataToProcessBeforeOrCurrent(callback) {
                // todo
                callback();
            }
        ], function (err, data) {

            if (err) {
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

        workflowService.save().then(function (workflowService) {

            if (workflowService.status != WorkflowService.statusCodes.ERROR) {
                self.finishWorkflow(Workflow.statusCodes.ERROR, function (err) {
                    cb(null, workflowService);
                });
            } else {
                cb(null, workflowService);
            }
        }).catch(cb);
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
        workflow.save().then(function (updatedWorkflow) {
            workflow = updatedWorkflow;
            logger.info('Workflow id:' + updatedWorkflow.id + ' finished with status: ' + workflow.status);
            cb(null, workflow);
        }).catch(function (err) {
            cb(err);
        });
    }
}

module.exports = Runner;