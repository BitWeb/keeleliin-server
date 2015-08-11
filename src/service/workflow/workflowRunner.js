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
var SubstepRunner = require('./substep/substepRunner');
var ResourceHandler = require('./resource/resourceHandler');
var StatusHolder = require('./statusHolder');

function Runner() {
    var self = this;

    var workflow;
    var statusHolder;
    var substepRunner;
    var resourceHandler;

    this.init = function (workflowId, cb) {

        async.waterfall(
            [
                function getWorkflow(callback) {
                    workflowDaoService.getWorkflow(workflowId, function (err, item) {
                        if (err) { return callback(err); }
                        workflow = item;
                        callback();
                    });
                },
                function getProject(callback) {
                    workflow.getProject().then(function (project) {
                        if(!project) return callback('Project not found');
                        return callback(null, project);
                    }).catch(function(error) {
                        return callback(error.message);
                    });
                },
                function createHandlers(project, callback) {
                    statusHolder = new StatusHolder();
                    substepRunner = new SubstepRunner(project, workflow);
                    resourceHandler = new ResourceHandler(project);
                    callback();
                }
            ],
            function (err) {
                cb(err);
            }
        );
    };


    this.run = function (workflowId, cb) {

        logger.debug('Run workflow id: ' + workflowId);
        async.waterfall(
            [
                function init(callback) {
                    self.init(workflowId, callback);
                },
                function checkStatusForRun(callback) {
                    if (workflow.status != Workflow.statusCodes.INIT) {
                        return callback('Antud töövoog on juba varem käivitatud');
                    }
                    return callback()
                },
                function startWorkflow(callback) {
                    workflow.status = Workflow.statusCodes.RUNNING;
                    workflow.datetimeStart = new Date();
                    workflow.save().then(function () {
                        callback();
                    }).catch(function (err) {
                        callback(err);
                    });
                }
            ],
            function finishStartRun(err) {
                if (err) {
                    logger.error(err);
                    return cb(err);
                }
                logger.debug('Return to user');
                cb(null, workflow);
                logger.debug('Continue with running workflow');
                self._startHandleServices();
            }
        );
    };


    this._startHandleServices = function () {

        workflow.getWorkflowServices().then(function (workflowServices) {
            logger.debug('Handle services');
            if(workflowServices.length > 0){
                self._continueFromSubStep( null, function (err) {
                    logger.debug('returned from NULL substep', err);
                });
            } else {
                logger.debug('No service to handle on index 0. Finish workflow');
                return self.finishWorkflow(Workflow.statusCodes.FINISHED, function (err) {
                    logger.debug('Workflow ' + workflow + ' finished.');
                });
            }
        }).catch(function (err) {
            logger.error(err);
        });
    };

    this._continueFromSubStep = function (fromSubStep, cb) {

        logger.debug('Continue from substep id: ' + (fromSubStep != undefined ? fromSubStep.id: null));

        async.waterfall(
            [
                function getWorkflowService(callback){
                    if (fromSubStep == null) {
                        workflow.getFirstWorkflowService(function (err, workflowService) {
                            callback(err, workflowService);
                        } );
                    } else {
                        fromSubStep.getWorkflowService().then(function (previousWorkflowService) {
                            previousWorkflowService.getNextWorkflowService(function (err, workflowService) {
                                callback(err, workflowService);
                            });
                        }).catch(function (err) {
                            callback(err.message);
                        });
                    }
                },
                function handleIt(workflowService, callback) {
                    self._handleWorkflowService(workflowService, fromSubStep, callback );
                }
            ],
            function (err) {
                cb( err );
            }
        );
    };

    this._handleWorkflowService = function (workflowService, fromSubStep, cb) {

        async.waterfall([
            function startWfService(callback) {
                self.startWorkflowService(workflowService, callback);
            },
            function updateFilesToParseCount(callback) {
                statusHolder.updateFilesToParseCount(workflowService, 1);
                callback(null);
            },
            function handleInputResources(callback) {
                resourceHandler.getWorkflowServiceSubStepsInputResources(
                    workflowService,
                    fromSubStep,
                    function handleSubResourceJunk( err, resourcesJunk, junkCb ) {
                        logger.debug('Got to handle sub input resources : ' + resourcesJunk.length);
                        if( err ){
                            logger.error( err );
                            return false;
                        }

                        statusHolder.updateSubStepsToRunCount(workflowService, 1);
                        self._makeWorkflowServiceSubStep(resourcesJunk, workflowService, fromSubStep, function (err, subStep) {
                            logger.debug('Start running subStep id: ' + subStep.id);
                            junkCb(err); //junk is given over
                            self._runSubStep(subStep, workflowService);
                        });
                    },
                    function resourcesTraversed(err) {
                        if(err){
                            logger.error(err);
                        }
                        logger.debug('Workflow service resources traversed from substep: ' + (fromSubStep != null ? fromSubStep.id : null) + ' workflowServiceId ' + workflowService.id);
                        return callback(err);
                    }
                );
            },
            function (callback) {
                statusHolder.updateFilesToParseCount(workflowService, -1);
                callback();
            }
        ], function (err) {
            logger.info('workflow service ' + workflowService + ' handling started from sub step ' + (fromSubStep != undefined ? fromSubStep.id : null));
            if (err) {
                logger.error(err);
                workflowService.log = err;
                self.finishWorkflowService(workflowService, Workflow.statusCodes.ERROR, function (err) {
                    logger.error('WorkflowService finished with error: ' + err);
                });
                cb(err);
                return;
            }
            cb(); //last subStep output is passed over ond stored
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
                return self._continueFromSubStep( subStep, function (err) {
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