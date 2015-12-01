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

var SubstepHandler = require('./substep/substepHandler');
var ResourceHandler = require('./resource/resourceHandler');
var WorkflowHolder = require('./workflowHolder');


function Runner() {

    var self = this;
    var workflowHolder;
    var substepHandler;
    var resourceHandler;

    this.run = function (workflowId, cb) {
        logger.debug('Run workflow id: ' + workflowId);
        async.waterfall(
            [
                function initWorkflowHolder(callback) {
                    workflowHolder = new WorkflowHolder( workflowId);
                    workflowHolder.init( function (err) {
                        callback(err);
                    });
                },
                function createHandlers( callback ) {
                    substepHandler = new SubstepHandler(workflowHolder.project, workflowHolder.workflow);
                    resourceHandler = new ResourceHandler(workflowHolder.project, workflowHolder.workflow);
                    workflowHolder.start(callback);
                }
            ],
            function startDone(err) {
                logger.debug('Return to user & Continue with running workflow ');
                if (err) {
                    logger.error(err);
                    return cb(err);
                }
                cb(null, workflowHolder.workflow);
                self._continueFromSubStep( null );
            }
        );
    };


    this._continueFromSubStep = function (subStep) {

        logger.debug('Continue from substep id: ' + (subStep != undefined ? subStep.id: null));

        var currentWorkflowService;
        var nextWorkflowService;

        async.waterfall(
            [
                function getCurrentSubstepWorkflowService( callback ) {
                    if( subStep != null ){
                        subStep.getWorkflowService().then(function (workflowService) {
                            currentWorkflowService = workflowService;
                            callback();
                        });
                    } else {
                        callback();
                    }
                },
                function getNextWorkflowService( callback ){
                    workflowHolder.getSubstepFollowingWorkflowService(subStep, function (err, next) {
                        nextWorkflowService = next;
                        callback( err );
                    });
                },

                function ( callback ) {

                    if(!nextWorkflowService){ //LAST service substep
                        if( currentWorkflowService ){
                            substepHandler.mapLastServiceSubstepResources(subStep, function (err) {
                                return workflowHolder.tryToCloseWorkflowFromWorkflowService( currentWorkflowService, callback);
                            });
                        } else {
                            logger.trace('Eelnevat töövoo teenust ei leitud'); //happens when no services in flow
                            callback();
                        }
                    } else {
                        //
                        nextWorkflowService.getService().then(function (nextService) {
                            if(!nextService || nextService.isActive == false){
                                return callback('Teenust ei leitud! Teenus on kustutatud või mitteaktiivne.');
                            }

                            if(nextService.isSynchronous){
                                logger.debug('Next service is Synchronous');
                                if(!subStep){ // esimene töövoo samm
                                    logger.debug('No previous substep. run');
                                    return self._handleWorkflowService(nextWorkflowService, subStep, currentWorkflowService, callback );
                                }

                                workflowHolder.canFinishWorkflowService( currentWorkflowService, function (err, canFinish) {
                                    if(err){
                                        return callback(err);
                                    }

                                    if(canFinish){
                                        logger.debug('Can finish. Next status: ' + nextWorkflowService.status);
                                        if(nextWorkflowService.status == Workflow.statusCodes.INIT){
                                            return self._handleWorkflowService(nextWorkflowService, subStep, currentWorkflowService, callback );
                                        } else {
                                            return callback();
                                        }
                                    } else {
                                        logger.debug('Can not finish');
                                        return callback(); //If not - break the flow
                                    }
                                });
                            } else {
                                self._handleWorkflowService(nextWorkflowService, subStep, currentWorkflowService, callback );
                            }
                        });
                    }
                }
            ],
            function (err) {
                if(err){
                    logger.error( err );
                    workflowHolder.workflow.log = err;
                    return workflowHolder.finishWorkflow(Workflow.statusCodes.ERROR, function (err) {
                        logger.debug('Workflow ' + workflowHolder.workflow.id + ' breaked with status ' + workflowHolder.workflow.status + '. Came from substep ' + (subStep != undefined ? subStep.id: null));
                    });
                }
            }
        );
    };

    this._handleWorkflowService = function (workflowService, fromSubStep, fromWorkflowService, cb) {

        logger.debug('Handle WorkflowService ' + workflowService.id + ' from substep ' + (fromSubStep ? fromSubStep.id:null));

        var stepsCreated = 0;

        async.waterfall([
            function startWfService(callback) {
                workflowService.start(callback);
            },
            function checkHistory(callback) {
                if(fromSubStep){
                    workflowHolder.tryToCloseWorkflowFromWorkflowService(fromWorkflowService, function (err, success) {
                        logger.debug('tried to close previous workflowService ' + fromWorkflowService.id + ' result status: ' + fromWorkflowService.status);
                        callback();
                    });
                } else {
                    callback();
                }
            },
            function updateFilesToParseCount(callback) {
                workflowHolder.updateFilesToParseCount(workflowService, 1);
                callback(null);
            },
            function handleInputResources(callback) {

                logger.debug('Handle input resources');

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
                        workflowHolder.updateSubStepsToRunCount(workflowService, 1);
                        substepHandler.makeWorkflowServiceSubStep(resourcesJunk, workflowService, fromSubStep, function (err, subStep) {
                            logger.debug('Start running subStep id: ' + subStep.id);
                            junkCb(err); //junk is given over
                            self._runSubStep(subStep, workflowService);
                        });
                    },
                    function resourcesTraversed(err) {

                        logger.debug('resources traversed');

                        if(err){
                            logger.error(err);
                        }
                        logger.debug('Workflow service resources traversed from substep: ' + (fromSubStep != null ? fromSubStep.id : null) + ' workflowServiceId ' + workflowService.id);
                        return callback(err);
                    }
                );
            },
            function (callback) {
                workflowHolder.updateFilesToParseCount(workflowService, -1);
                callback();
            }
        ], function (err) {
            logger.info('workflow service ' + workflowService.id + ' handling started from sub step ' + (fromSubStep != undefined ? fromSubStep.id : null));
            if (err) {
                logger.error(err);
                workflowService.log = err;
                workflowHolder.finishWorkflowService(workflowService, Workflow.statusCodes.ERROR, function (err) {
                    logger.error('WorkflowService finished with error: ' + err);
                });
                return cb(err);
            }

            if( stepsCreated == 0 ){
                logger.error('Järgnevaid samme ei loodud.' + workflowService.id);
                if(fromSubStep){
                    fromSubStep.errorLog = 'Järgnevale teenusele sobivaid sisendressursse ei leitud';
                    logger.error(fromSubStep.errorLog + ' Alamsammust: ' + fromSubStep.id);
                    return workflowHolder.breakFromSubstep(fromSubStep, Workflow.statusCodes.ERROR)
                }
                workflowService.log = 'Teenusele sobivaid sisendressursse ei leitud';
                logger.error(workflowService.log);
                return workflowHolder.breakFromService(workflowService, Workflow.statusCodes.ERROR);
            }
            cb();
        });
    };

    this._runSubStep = function (subStep, workflowService) {

        async.waterfall([
            function (callback) {
                substepHandler.run(subStep, function (err, subStep) {
                    if(err){
                        workflowHolder.breakFromSubstep(subStep, Workflow.statusCodes.ERROR);
                        return callback( err );
                    }

                    logger.info('Substep is finished running: ' + subStep.id + ' status: ' + subStep.status);
                    workflowHolder.updateSubStepsToRunCount(workflowService, -1);
                    workflowHolder.canContinueFromSubstep( subStep, function (err, success) {
                        logger.debug('Can continue from substep : ' + subStep.id + ' : ', success);
                        callback(err, success);
                    });
                });
            },
            function (success, callback) {
                if(success){
                    logger.debug('Continue from substep: ' + subStep.id);
                    self._continueFromSubStep( subStep );
                } else {
                    logger.debug('Can not continue from substep: ' + subStep.id);
                    workflowHolder.breakFromSubstep(subStep, subStep.status);
                }
                return callback();
            }
        ], function (err) {
            if(err){
                logger.trace(err);
            }
        });
    };
}

module.exports = Runner;