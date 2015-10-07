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
var ResourceAssociation = require(__base + 'src/service/dao/sql').ResourceAssociation;

var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
var SubstepHandler = require('./substep/substepHandler');
var ResourceHandler = require('./resource/resourceHandler');
var StatusHolder = require('./statusHolder');
var notificationService = require(__base + 'src/service/notificationService');
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;

function Runner() {

    var self = this;
    var workflow;
    var statusHolder;
    var substepHandler;
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
                    substepHandler = new SubstepHandler(project, workflow);
                    resourceHandler = new ResourceHandler(project, workflow);
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
                function start(callback) {
                    workflow.start(callback);
                }
            ],
            function startDone(err) {
                logger.debug('Return to user & Continue with running workflow ');
                if (err) {
                    logger.error(err);
                    return cb(err);
                }
                cb(null, workflow);
                self._continueFromSubStep( null );
            }
        );
    };


    this._continueFromSubStep = function (subStep) {

        logger.debug('Continue from substep id: ' + (subStep != undefined ? subStep.id: null));

        async.waterfall(
            [
                function getNextWorkflowService(callback){
                    if (subStep == null) {
                        workflow.getFirstWorkflowService(function (err, firstWorkflowService) {
                            if(!firstWorkflowService && !err){
                                err = 'Tövoos ei ole ühtegi teenust';
                            }
                            callback(err, firstWorkflowService, null);
                        } );
                    } else {
                        subStep.getWorkflowService().then(function (workflowService) {
                            workflowService.getNextWorkflowService(function (err, nextWorkflowService) {
                                callback(err, nextWorkflowService, workflowService);
                            });
                        }).catch(function (err) {
                            callback(err.message);
                        });
                    }
                },

                function checkFoundWorkflowService(nextWorkflowService, workflowService, callback) {
                    if(nextWorkflowService){
                        //
                        nextWorkflowService.getService().then(function (nextService) {
                            if(!nextService || nextService.isActive == false){
                                return callback('Teenust ei leitud! Teenus on kustutatud või mitteaktiivne.');
                            }

                            if(nextService.isSynchronous){
                                logger.debug('Next service is Synchronous');

                                if(!subStep){ // esimene töövoo samm
                                    logger.debug('No previous substep. run');
                                    return self._handleWorkflowService(nextWorkflowService, subStep, callback );
                                }

                                self.canFinishWorkflowService( workflowService, function (err, canFinish) {
                                    if(err){
                                        return callback(err);
                                    }

                                    if(canFinish){
                                        logger.debug('Can finish');
                                        nextWorkflowService.reload().then(function () {
                                            logger.debug('Next status: ' + nextWorkflowService.status);
                                            if(nextWorkflowService.status == Workflow.statusCodes.INIT){
                                                return self._handleWorkflowService(nextWorkflowService, subStep, callback );
                                            } else {
                                                callback();
                                            }
                                        });
                                        return;
                                    }
                                    logger.debug('Can not finish');
                                    return callback(); //If not - break the flow
                                });
                            } else {
                                self._handleWorkflowService(nextWorkflowService, subStep, callback );
                            }
                        });
                    } else {
                        substepHandler.mapLastServiceSubstepResources(subStep, function (err) {
                            if(workflowService){
                                return self.tryToCloseWorkflowFromWorkflowService(workflowService, callback);
                            } else {
                                logger.trace('Eelnevat töövoo teenust ei leitud'); //happens when no servoices in flow
                                callback();
                            }
                        });
                    }
                }
            ],
            function (err) {
                if(err){
                    logger.error( err );
                    workflow.log = err;
                    return self.finishWorkflow(Workflow.statusCodes.ERROR, function (err) {
                        logger.debug('Workflow ' + workflow + ' breaked with status ' + workflow.status + '. Came from substep ' + (subStep != undefined ? subStep.id: null));
                    });
                }
            }
        );
    };

    this._handleWorkflowService = function (workflowService, fromSubStep, cb) {

        logger.debug('Handle WorkflowService ' + workflowService.id + ' from substep ' + (fromSubStep ? fromSubStep.id:null));

        var stepsCreated = 0;

        async.waterfall([
            function startWfService(callback) {
                workflowService.start(callback);
            },
            function checkHistory(callback) {
                if(fromSubStep){
                    fromSubStep.getWorkflowService().then(function (previousWorkflowService) {
                        self.tryToCloseWorkflowFromWorkflowService(previousWorkflowService, function (err, success) {
                            logger.debug('tried to close previous workflowService ' + previousWorkflowService.id + ' result status: ' + previousWorkflowService.status);
                        });
                    });
                }
                callback();
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

                        stepsCreated++;
                        statusHolder.updateSubStepsToRunCount(workflowService, 1);
                        substepHandler.makeWorkflowServiceSubStep(resourcesJunk, workflowService, fromSubStep, function (err, subStep) {
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
                return cb(err);
            }

            if( stepsCreated == 0 ){
                if(fromSubStep){
                    fromSubStep.log = 'Teenusele sobivaid sisendressursse ei leitud';
                    return self._breakFromSubstep(fromSubStep, Workflow.statusCodes.ERROR)
                }
                workflowService.log = 'Teenusele sobivaid sisendressursse ei leitud';
                return self._breakFromService(workflowService, Workflow.statusCodes.ERROR);
            }

            cb();
        });
    };

    this._runSubStep = function (subStep, workflowService) {

        async.waterfall([
            function (callback) {
                substepHandler.run(subStep, function (err, subStep) {
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
                self._continueFromSubStep( subStep );

                return callback();
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
                    return callback('Töövoog on katkestatud.');
                }

                if(workflow.status == Workflow.statusCodes.ERROR){
                    return callback('Töövoos on tekkinud viga.');
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
        subStep.getWorkflowService().then(function (workflowService) {
            self._breakFromService(workflowService, statusCode);
        });
    };

    this._breakFromService = function (workflowService, statusCode) {

        if(statusCode == Workflow.statusCodes.FINISHED || statusCode == Workflow.statusCodes.INIT || statusCode == Workflow.statusCodes.FINISHED){
            return logger.error('Can not break with not negative statuscode');
        }

        async.waterfall([
            function ( callback ) {
                self.finishWorkflowService(workflowService, statusCode, function (err) {
                    callback(err);
                });
            },
            function (callback) {
                self.finishWorkflow(statusCode, function (err) {
                    callback(err);
                });
            }
        ], function (err) {
            if (err) {
                return logger.error(err);
            }
            logger.error('WorkflowService id: ' + workflowService.id + ' breaked workflow.');
        });
    };

    this.canFinishWorkflowService = function (workflowService, cb) {

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
                        workflowId: workflowService.workflowId,
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
                return self.finishWorkflowService(workflowService, Workflow.statusCodes.ERROR, function (err) {
                    logger.error(err);
                    cb('Staatuse kontrollimisel tekkis viga');
                });
            }
            cb(null, true);
        });
    };

    this.tryToCloseWorkflowFromWorkflowService = function (workflowService, cb) {
        async.waterfall([
                function tryToCloseService(callback) {
                    self.canFinishWorkflowService( workflowService, function (err, canFinish) {
                        logger.trace(canFinish);
                        if(canFinish){
                            self.finishWorkflowService( workflowService, Workflow.statusCodes.FINISHED, function (err, success) {
                                logger.trace('Viimane töövoo samm lõpetati staatusega', success);
                                callback(err, success);
                            });
                        } else {
                            logger.trace('Tuldi viimasest teenusest. Lõpetada ei saa.');
                            callback(err, false);
                        }
                    });
                },
                function tryToCloseWorkflow( success, callback ) {
                    if(!success){
                        return callback(null, false);
                    }

                    self.canFinishWorkflow(function (err, success) {
                        if(err){
                            workflow.error = err;
                            return self.finishWorkflow(Workflow.statusCodes.ERROR, function (err) {
                                logger.trace('Töövoog lõpetati staatusega', success);
                                return callback(err, false);
                            });
                        }
                        if(success){
                            return self.finishWorkflow(Workflow.statusCodes.FINISHED, function (err) {
                                logger.trace('Töövoog lõpetati staatusega', success);
                                callback(err, true);
                            });
                        }
                        return callback(err, false);
                    });
                }
            ],
            function (err, success) {
                cb( err, success );
            }
        );
    };


    this.finishWorkflowService = function (workflowService, status, cb) {
        logger.info('Set service status ' + status);

        async.waterfall([
            function finishWorkflowService(callback) {
                workflowService.finish(status, callback);
            },
            function checkForErrorClose(callback) {
                if (workflowService.status == Workflow.statusCodes.ERROR) {
                    self.finishWorkflow(Workflow.statusCodes.ERROR, function (err) {
                        cb(err, false);
                    });
                } else {
                    callback(null, true);
                }
            }
        ], function (err, success) {
            if(err){
                workflow.log = err;
                return self.finishWorkflow( Workflow.statusCodes.ERROR, function (err, success) {
                    cb(err, false);
                });
            }
            cb(err, success);
        });
    };

    this.canFinishWorkflow = function (cb) {

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
                        return callback('Errors in subservices');
                    }
                    return callback();
                }).catch(function (err) {
                    callback(err.message);
                });
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
                        return cb(null, false);
                    }
                    return callback();
                }).catch(function (err) {
                    return callback(err.message);
                });
            }
        ], function (err) {
            if (err) {
                return cb(err);
            }
            return cb(null, true);
        });
    };

    this.finishWorkflow = function (status, cb) {
        workflow.finish(status, function (err) {
            logger.info('Workflow id:' + workflow.id + ' finished with status: ' + workflow.status);
            var notificationTypeCode = NotificationType.codes.WORKFLOW_FINISHED;
            if (workflow.status == Workflow.statusCodes.ERROR) {
                notificationTypeCode =  NotificationType.codes.WORKFLOW_ERROR;
            }

            notificationService.addNotification(workflow.userId, notificationTypeCode, workflow.id, function(error, notification) {
                // Do not cancel workflow runner if notification save fails
                if(error){
                    logger.error(error);
                }
                cb();
            });

        });
    }
}

module.exports = Runner;