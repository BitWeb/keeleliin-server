/**
 * Created by priit on 27.07.15.
 */
var logger = require('log4js').getLogger('workflow_holder');

var async = require('async');
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var Resource = require(__base + 'src/service/dao/sql').Resource;
var WorkflowServiceModel = require(__base + 'src/service/dao/sql').WorkflowService;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var notificationService = require(__base + 'src/service/notificationService');
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;

function WorkflowHolder( workflowId ){

    var self = this;
    this.workflowId = workflowId;
    this.workflow = null;
    var workflowMap = null;

    this.project = null;

    this.init = function (cb) {

        async.waterfall(
            [
                function (callback) {
                    Workflow.find({
                        where: {id: workflowId},
                        include: [
                            {
                                model: WorkflowServiceModel,
                                as: 'workflowServices',
                                attributes: [
                                    'id',
                                    'status',
                                    'orderNum',
                                    'log',
                                    'workflowId'
                                ],
                                where: {},
                                required: false
                            }
                        ]
                    }).then(function (item) {
                        self.workflow = item;
                        callback();
                    }).catch(function (err) {
                        callback(err.message);
                    });
                },
                function ( callback ) {
                    self._createWorkflowMap();
                    callback();
                },
                function (callback) {
                    self.workflow.getProject().then(function (item) {
                        self.project = item;
                        return callback();
                    }).catch(function(error) {
                        return callback(error.message);
                    });
                }
            ],
            function (err) {
                cb(err);
            }
        );
    };

    this.getWorkflowServiceById = function (id) {
        for(i in self.workflow.workflowServices){
            if(self.workflow.workflowServices[i].id == id){
                return self.workflow.workflowServices[i];
            }
        }
        throw new Error('Tövoo teenust ei leitud');
    };

    this.start = function (callback) {
        self.workflow.start(function (err) {
            workflowMap.status = self.workflow.status;
            callback(err);
        });
    };

    this.getSubstepFollowingWorkflowService = function (subStep, cb) {

        if(subStep == null){
            self.workflow.getFirstWorkflowService(function (err, firstWorkflowService) {
                if(!firstWorkflowService && !err){
                    err = 'Tövoos ei ole ühtegi teenust';
                }
                cb(err, firstWorkflowService);
            });
        } else {
            var workflowService  = self.getWorkflowServiceById(subStep.workflowServiceId);
            workflowService.getNextWorkflowService(function (err, nextWorkflowService) {
                cb(err, nextWorkflowService);
            });
        }
    };


    this.canFinishWorkflow = function (cb) {

        var maxOrderNum = -1;
        var lastService = null;

        for(i in workflowMap.services){
            if( workflowMap.services[i].orderNum > maxOrderNum ){
                maxOrderNum = workflowMap.services[i].orderNum;
                lastService = workflowMap.services[i];
            }
        }

        self.canFinishWorkflowService( lastService, function (err, canFinish) {
            canFinish = canFinish && lastService.status == Workflow.statusCodes.FINISHED;
            cb(err, canFinish)
        });
    };

    this.canContinueFromSubstep = function ( subStep, cb ) {

        var canContinue = true;

        async.waterfall([
            function checkStatuses(callback) {

                logger.debug('Check status ' + subStep.status);

                if ( subStep.status != Workflow.statusCodes.FINISHED) {
                    logger.debug('Cant continue: Alamsamm ei ole FINISHED staatusega');
                    canContinue = false;
                } else if (workflowMap.status != Workflow.statusCodes.RUNNING) {
                    logger.debug('Cant continue: Töövoog ei ole RUNNING staatusega');
                    subStep.log = 'Töövoog ei ole RUNNING staatusega';
                    canContinue = false;
                }

                callback();
            },
            function (callback) {

                if(!canContinue){
                    return callback();
                }

                self.workflow.reload().then(function () {

                    if(self.workflow.status == Workflow.statusCodes.CANCELLED){
                        subStep.log = 'Töövoog on katkestatud';
                        logger.debug('Cant continue: Töövoog on katkestatud');
                        canContinue = false;
                        return callback();
                    }

                    if(self.workflow.status == Workflow.statusCodes.ERROR){
                        logger.debug('Cant continue: Töövoog on katkestatud');
                        canContinue = false;
                        return callback();
                    }

                    return callback();

                }).catch(function (err) {
                    logger.error( err );
                    callback(err.message);
                });
            }
        ], function (err) {
            if(err){
                logger.error( err );
            }
            logger.trace( 'Can continue: ', canContinue );
            cb(err, canContinue);
        });
    };

    this.finishWorkflow = function (status, cb) {

        workflowMap.status = status;

        self.workflow.finish(status, function (err) {
            logger.info('Workflow id:' + self.workflowId + ' finished with status: ' + self.workflow.status);
            var notificationTypeCode = NotificationType.codes.WORKFLOW_FINISHED;
            if (self.workflow.status == Workflow.statusCodes.ERROR) {
                notificationTypeCode =  NotificationType.codes.WORKFLOW_ERROR;
            }

            notificationService.addNotification(self.workflow.userId, notificationTypeCode, self.workflowId, function(error, notification) {
                // Do not cancel workflow runner if notification save fails
                if(error){
                    logger.error(error);
                }
                cb();
            });

        });
    };

    this.finishWorkflowService = function (workflowService, status, cb) {
        logger.info('Set service status ' + status);

        workflowMap.services[workflowService.id].status = status;

        async.waterfall([
            function finishWorkflowService(callback) {
                workflowService.finish(status, callback);
            },
            function checkForErrorClose(callback) {
                if (workflowService.status == Workflow.statusCodes.ERROR) {
                    self.finishWorkflow(Workflow.statusCodes.ERROR, function (err) {
                        callback(err, false);
                    });
                } else {
                    callback(null, true);
                }
            }
        ], function (err, success) {
            if(err){
                self.workflow.log = err;
                return self.finishWorkflow( Workflow.statusCodes.ERROR, function (err, success) {
                    cb(err, false);
                });
            }
            cb(err, success);
        });
    };

    this.breakFromSubstep = function (subStep, statusCode) {
        logger.debug('Break from substep ' + subStep.id);

        subStep.save().then(function () {
            var workflowService = self.getWorkflowServiceById(subStep.workflowServiceId);
            self.breakFromService(workflowService, statusCode);
        });
    };

    this.breakFromService = function (workflowService, statusCode) {

        if(statusCode == Workflow.statusCodes.FINISHED || statusCode == Workflow.statusCodes.INIT || statusCode == Workflow.statusCodes.RUNNING){
            return logger.error('Can not break with not negative statuscode ', statusCode);
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

    this.tryToCloseWorkflowFromWorkflowService = function (workflowService, cb) {

        async.waterfall([
                function tryToCloseService(callback) {
                    self.canFinishWorkflowService( workflowService, function (err, canFinish) {
                        if(canFinish){
                            self.finishWorkflowService( workflowService, Workflow.statusCodes.FINISHED, function (err, success) {
                                logger.trace('Viimane töövoo samm ' + workflowService.id + ' lõpetati staatusega', success);
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
                        logger.debug('Cant try to close workflow');
                        return callback(null, false);
                    }
                    self.canFinishWorkflow(function (err, success) {

                        logger.debug('Can finish workflow: ' + success);

                        if(err){
                            self.workflow.log = err;
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

    this._createWorkflowMap = function () {

        workflowMap = {
            id: self.workflow.id,
            status: self.workflow.status
        };

        workflowMap.services = {};
        for(i in self.workflow.workflowServices){
            var wfService = self.workflow.workflowServices[i];
            workflowMap.services[wfService.id] = {
                id: wfService.id,
                status: wfService.status,
                orderNum: wfService.orderNum,
                filesToParse: 0,
                subStepsToRun: 0
            };
        }
    };

    this.updateFilesToParseCount = function ( workflowService, change) {
        workflowMap.services[workflowService.id].filesToParse = workflowMap.services[workflowService.id].filesToParse + change;
        return this;
    };

    this.updateSubStepsToRunCount = function ( workflowService, change ) {
        workflowMap.services[workflowService.id].subStepsToRun = workflowMap.services[workflowService.id].subStepsToRun + change;
        return this;
    };


    this.canFinishWorkflowService = function (workflowService, callback) {

        logger.debug('Can finish service: ' + workflowService.id + ' files to parse:' + self.hasFilesToParseCount(workflowService) + ' substeps to run:' + self.hasSubStepsToRun(workflowService) + ' previous not finished services:' + self.hasPreviousNotFinishedServices(workflowService));

        var canFinish =  !self.hasFilesToParseCount(workflowService) && !self.hasSubStepsToRun(workflowService) && !self.hasPreviousNotFinishedServices(workflowService);
        callback(null, canFinish);
    };

    this.hasFilesToParseCount = function (workflowService) {
        for(i in workflowMap.services){
            var item = workflowMap.services[i];
            if(item.orderNum <= workflowService.orderNum && item.filesToParse > 0){
                return true;
            }
        }
        return false;
    };

    this.hasSubStepsToRun = function (workflowService) {
        for(i in workflowMap.services){
            var item = workflowMap.services[i];
            if(item.orderNum <= workflowService.orderNum && item.subStepsToRun > 0){
                return true;
            }
        }
        return false;
    };

    this.hasPreviousNotFinishedServices = function (workflowService) {
        for(i in workflowMap.services){
            var item = workflowMap.services[i];
            if(item.orderNum < workflowService.orderNum && item.status != Workflow.statusCodes.FINISHED){
                return true;
            }
        }
        return false;
    };
}

module.exports = WorkflowHolder;
