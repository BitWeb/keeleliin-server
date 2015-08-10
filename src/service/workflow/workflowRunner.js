/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('workflow_runner');
var async = require('async');
var config = require(__base + 'config');
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var Project = require(__base + 'src/service/dao/sql').Project;



var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var WorkflowService = require(__base + 'src/service/dao/sql').WorkflowService;
var Resource = require(__base + 'src/service/dao/sql').Resource;
var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
var SubstepRunner = require('./substep/substepRunner');
var ResourceHandler = require('./resource/resourceHandler');
var StatusHolder = require('./statusHolder');

function Runner() {
    var self = this;

    var workflow;
    var project;
    var workflowServices;
    var statusHolder;
    var substepRunner;
    var resourceHandler;


    this.run = function (workflowId, cb) {
        logger.debug('Run workflow id: ' + workflowId);
        async.waterfall([
            function getWorkflow(callback) {
                self._getWorkflow(workflowId, callback);
            },
            function checkStatusForRun(callback) {
                self._checkStatusForRun(callback);
            },
            function startWorkflow(callback) {
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

    this._getWorkflow = function(workflowId, callback) {
        workflowDaoService.getWorkflow(workflowId, function (err, item) {
            if (err) { return callback(err); }
            workflow = item;
            callback();
        });
    };

    this._checkStatusForRun = function (cb) {
        if (workflow.status != Workflow.statusCodes.INIT) {
            return cb('Antud töövoog on juba varem käivitatud');
        }
        return cb()
    };

    this._startWorkflow = function (cb) {

        async.waterfall([
            function getProject(callback) {
                Project.find({ where: { id: workflow.projectId }}).then(function(item) {
                    if(!item){
                        return callback('Project not found');
                    }
                    project = item;
                    return callback();
                }).catch(function(error) {
                    return callback(error.message);
                });
            },
            function (callback) {
                statusHolder = new StatusHolder();
                substepRunner = new SubstepRunner(project, workflow);
                resourceHandler = new ResourceHandler(project);
                callback();
            },
            function(callback){
                workflow.status = Workflow.statusCodes.RUNNING;
                workflow.datetimeStart = new Date();
                workflow.save().then(function () {
                    callback();
                }).catch(function (err) {
                    callback();
                });
            }
        ], function (err) {
            logger.debug('Return to user');
            cb(); // return to user and continue async
            logger.debug('Continue with running workflow');
            self._startHandleServices();
        });
    };

    this._startHandleServices = function () {

        logger.debug('Handle services');

        workflow.getWorkflowServices({order: [['order_num', 'ASC']]}).then(function (data) {
            workflowServices = data;
            logger.debug('Got ' + workflowServices.length + ' workflow service');

            if(workflowServices.length == 0){
                logger.debug('No service to handle on index 0. Finish workflow');
                return self.finishWorkflow(Workflow.statusCodes.FINISHED, function () {
                    return;
                });
            }

            self._continueFromSubStep( null, function (err) {

            });
        }).catch(function (err) {
            self.finishWorkflow(Workflow.statusCodes.ERROR, function (err, item) {
                return;
            });
        });
    };

    this._continueFromSubStep = function (fromSubStep, cb) {

        logger.debug('Continue from substep id: ' + (fromSubStep != undefined ? fromSubStep.id: null));

        async.waterfall([
            function isFirst(callback) {
                if (fromSubStep == null) {
                    var workflowService = workflowServices[0];
                    workflowService.orderNum = 0;
                    return self._handleWorkflowService(workflowService, null, cb);
                } else {
                    return callback();
                }
            },
            function getPreviousWorkflowService(callback) {
                fromSubStep.getWorkflowService().then(function (previousWorkflowService) {
                    callback(null, previousWorkflowService);
                }).catch(function (err) {
                    callback(err.message);
                });
            },
            function getNextWorkflowService(previousWorkflowService, callback) {

                var nextOrderNum = previousWorkflowService.orderNum + 1;
                var workflowService = workflowServices[nextOrderNum];

                if (workflowService) {
                    logger.debug('Continue with wf service: ' + workflowService.id);

                    workflowService.orderNum = nextOrderNum;
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
                        return callback(null, resources);
                    });
                } else {
                    workflow.getInputResources().then(function (resources) {
                        logger.debug('Start handle first service resources');
                        return callback(null, resources);
                    }).catch(function (err) {
                        logger.error(err);
                        return callback(err);
                    });
                }
            },
            function setResourcesToHandle(resources, callback) {
                statusHolder.updateFilesToParseCount(workflowService, resources.length);
                callback(null, resources);
            },
            function handleInputResources(resources, callback) {
                self._handleInputResources(resources, workflowService, fromSubStep, function (err) {
                    statusHolder.updateFilesToParseCount(workflowService, (resources.length*(-1)));
                    callback(err);
                });
            }
        ], function (err) {
            logger.info('workflow service ' + workflowService + ' handling started from sub step ' + (fromSubStep != undefined ? fromSubStep.id : null));
            if (err) {
                logger.error(err);
                workflowService.log = err;
                self.finishWorkflowService(workflowService, Workflow.statusCodes.ERROR, function (err) {
                    logger.error('WorkflowService finished with error: ' + err);
                });
            }
            cb(); //Do not finish previous service before output is given over.
        });
    };

    this._handleInputResources = function (currentResources, workflowService, fromSubStep, cb) {

        async.waterfall([
            function (callback) {
                resourceHandler.getWorkflowServiceSubStepsInputResources(
                    currentResources,
                    workflowService,
                    fromSubStep,
                    function handleSubResourceJunk(err, resources) {
                        if(err){
                            logger.error(err);
                            return;
                        }
                        logger.debug('Got to handle sub input resources : ' + resources.length);
                        statusHolder.updateSubStepsToRunCount(workflowService, 1);
                        self._makeWorkflowServiceSubStep(resources, workflowService, fromSubStep, function (err, subStep) {
                            logger.debug('Start running subStep id: ' + subStep);
                            self._runSubStep(subStep, workflowService);
                            return callback(err);
                        });
                    },
                    function resourcesTraversed(err) {
                        logger.debug('Workflow service resources traversed');
                        return callback(err);
                    }
                );
            }
        ], function (err) {
            cb( err );
        });
    };

    this.startWorkflowService = function (workflowService, cb) {

        if (workflowService.status == Workflow.statusCodes.INIT) {
            workflowService.status = Workflow.statusCodes.RUNNING;
            workflowService.datetimeStart = new Date();

            return workflowService.save().then(function () {
                cb(null);
            }).catch(cb);

        } else if (workflowService.status == Workflow.statusCodes.ERROR) {
            return cb('Töövoos on tekkinud viga');
        } else if (workflowService.status == Workflow.statusCodes.RUNNING) {
            logger.debug('Workflow already started');
            cb(null);
        } else {
            return cb('Töövoos staatus käivitamisel oli: ' + workflowService.status + '. TODO ');
        }
    };

    this._makeWorkflowServiceSubStep = function (resources, workflowService, previousStep, cb) {

        var subStepData = {
            workflowServiceId: workflowService.id,
            prevSubstepId: null,
            status: 'INIT',
            index: 0
        };

        if (previousStep) {
            subStepData.prevSubstepId = previousStep.id
        }

        WorkflowServiceSubstep.build(subStepData).save().then(function (subStep) {
            subStep.setInputResources(resources).then(function () {
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

        async.waterfall([
            function (callback) {
                substepRunner.run(subStep, function (err, subStep) {
                    if(!err){
                        logger.info('Substep is finished running: ' + subStep.id + ' status: ' + subStep.status);
                    }
                    statusHolder.updateSubStepsToRunCount(workflowService, -1);
                    self.checkForContinue(err, subStep, function (err) {
                        callback(err, subStep);
                    });
                });
            },
            function (substep, callback) {
                logger.debug('Continue from substep: ' + subStep.id);
                return self._continueFromSubStep(subStep, function (err) {
                    self.tryToFinishWorkflowService(workflowService, function (err, success) {
                        logger.info('Tried to close id: ' + workflowService.id + ' Success: ' + success);
                        if(success == true){
                            self.tryToFinishWorkflow(function () {
                                logger.debug('Tried to finish workflow id: ' + workflow.id + ' Status: ' + workflow.status);
                                callback(err);
                            });
                        }
                    });
                });
            }
        ], function (err) {
            if(err){
                logger.trace(err);
            }
        });
    };

    this.checkForContinue = function (err, subStep, cb) {

        async.waterfall([
            function reloadWorkflow(callback) {
                workflow.reload().then(function () {
                    callback();
                }).catch(function (err) {
                    callback(err.message);
                });
            },
            function checkStatuses(callback) {

                if(workflow.status == Workflow.statusCodes.CANCELLED){
                    self._breakFromSubstep(subStep, Workflow.statusCodes.CANCELLED);
                    return callback('Töövoog on katkestatud');
                }

                if (err || subStep.status != Workflow.statusCodes.FINISHED) {
                    logger.debug('Break substep: ' + subStep.id);
                    self._breakFromSubstep(subStep, subStep.status);
                    return callback('Töövoog sammus tekkis viga');
                }
                callback();
            }
        ], cb);
    };

    this._breakFromSubstep = function (subStep, statusCode) {

        async.waterfall([
            function (callback) {
                subStep.getWorkflowService().then(function (workflowService) {
                    callback(null, workflowService);
                });
            },
            function (workflowService, callback) {
                self.finishWorkflowService(workflowService, statusCode, function (err) {
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

        logger.debug('Order num:' + workflowService.orderNum + ' ID:' + workflowService.id);

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
                        workflowId: workflowService.workflowid,
                        status: {
                            ne: Workflow.statusCodes.FINISHED
                        },
                        orderNum: {
                            lt: workflowService.orderNum
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
                            ne: Workflow.statusCodes.FINISHED
                        }
                    },
                    include: [{
                        model: WorkflowService,
                        as: 'workflowService',
                        required: true,
                        where: {
                            workflowId: workflowService.workflowId,
                            orderNum: {
                                lte: workflowService.orderNum
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
                return self.finishWorkflowService(workflowService, Workflow.statusCodes.ERROR, cb);
            }

            self.finishWorkflowService(workflowService, Workflow.statusCodes.FINISHED, cb);
        });
    };

    this.finishWorkflowService = function (workflowService, status, cb) {
        logger.info('Set service status ' + status);

        if (workflowService.status != Workflow.statusCodes.ERROR) {
            workflowService.status = status;
            workflowService.datetimeEnd = new Date();
        }

        workflowService.save().then(function () {

            if (workflowService.status == Workflow.statusCodes.ERROR) {
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
                        workflowId: workflow.id,
                        status: Workflow.statusCodes.ERROR
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
                        workflowId: workflow.id,
                        status: {
                            in: [Workflow.statusCodes.INIT, Workflow.statusCodes.RUNNING]
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
        workflow.datetimeEnd = new Date();
        workflow.save().then(function () {
            logger.info('Workflow id:' + workflow.id + ' finished with status: ' + workflow.status);
            cb(null, workflow);
        }).catch(function (err) {
            cb(err);
        });
    }
}

module.exports = Runner;