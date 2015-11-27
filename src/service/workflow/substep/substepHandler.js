/**
 * Created by priit on 2.07.15.
 */

var logger = require('log4js').getLogger('substep_handler');
var async = require('async');
var fs = require('fs');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var ResourceAssociation = require(__base + 'src/service/dao/sql').ResourceAssociation;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var apiService = require('./../service/apiService');
var substepServiceDtoMapper = require('./substepServiceDtoMapper');
var config = require(__base + 'config');
var FileUtil = require('./../../../util/fileUtil');
var resourceService = require(__base + 'src/service/resourceService');

function SubStepHandler(project, workflow){

    var self = this;
    this.project = project;
    this.workflow = workflow;

    this.makeWorkflowServiceSubStep = function (inputResources, workflowService, previousStep, cb) {

        async.waterfall([
                function (callback) {
                    var subStepData = {
                        workflowServiceId: workflowService.id,
                        prevSubstepId: previousStep ? previousStep.id: null,
                        status: 'INIT',
                        index: 0
                    };

                    WorkflowServiceSubstep.create(subStepData).then(function (subStep) {
                        callback(null, subStep);
                    }).catch(function (err) {
                        logger.error('SubStep build error', err);
                        callback(err.message);
                    });

                },
                function (substep, callback) {

                    async.each( inputResources,
                        function (inputResource, innerCb) {

                            var associationData = {
                                context: ResourceAssociation.contexts.SUBSTEP_INPUT,
                                resourceId: inputResource.id,
                                userId: workflow.userId,
                                projectId: project.id,
                                workflowId: workflow.id,
                                workflowServiceSubstepId: substep.id
                            };

                            resourceService.createAssociation(associationData, function (err, association) {
                                innerCb(err);
                            });
                        },
                        function (err) {
                            callback(err, substep);
                        }
                    );
                }
            ],
            function (err, substep) {
                if(err){
                    logger.error( err );
                }
                cb(err, substep);
            }
        );
    };

    this.run = function (substep, cb) {

        async.waterfall([
            function setRunning(callback) {
                substep.status = 'RUNNING';
                substep.datetimeStart = new Date();
                substep.save().then(function (){
                    callback();
                }).catch(function (err) {
                    logger.error('Save step error', err);
                    callback(err.message);
                });
            },
            function getDto(callback) {
                substepServiceDtoMapper.getSubstepServiceDto(substep, callback);
            },
            function (dto, callback) {
                self.startProcessing(substep, dto, callback);
            }
        ], function (err) {
            if(err){
                logger.error(err);
                substep.log = err;
                return self._updateSubstepFinishStatus(substep, Workflow.statusCodes.ERROR, cb);
            }

            cb(null, substep);
        });
    };

    this.startProcessing = function (substep, dto, cb){

        async.waterfall([
            function makeInitialRequest(callback) {
                apiService.makeRequest(dto, callback);
            },
            function storeSubStepServiceSessionId(response, callback) {
                if(response && response.response){
                    substep.updateAttributes({
                        serviceSession: response.response.sessionId
                    }).then(function () {
                        callback(null, response);
                    });
                } else {
                    callback(null, response);
                }
            },
            function (response, callback) {
                logger.debug('Response: ', response);
                self._handleResponse(substep, dto, response, callback);
            }
        ], cb );
    };

    this._handleResponse = function (substep, dto, response, cb){

        if(!response || !response.response){
            logger.error('TODO:: No valid response', response);
            substep.log = JSON.stringify(response);
            return self._updateSubstepFinishStatus(substep, Workflow.statusCodes.ERROR, cb);
        }

        if(response.response.message == 'OK') {
            logger.info('Message OK');
            self._finishSubstepRequest(substep, dto, response, cb);
        } else if(response.response.message == 'RUNNING'){
            logger.info('Message RUNNING');
            self._recheckRequest(substep, dto, response, cb);
        } else if(response.response.message == 'ERROR'){
            logger.info('Message ERROR');
            logger.error(dto, response.response);
            substep.log = 'Got service error: ' + JSON.stringify(response.response.errors);
            self._updateSubstepFinishStatus(substep, Workflow.statusCodes.ERROR, cb);
        } else {
            logger.error('TODO:: Not OK');
            substep.log = 'No service response message not mapped: ' + response.response.message;
            self._updateSubstepFinishStatus(substep, Workflow.statusCodes.ERROR, cb);
        }
    };

    this._recheckRequest = function (subStep, dto, response, cb) {

        //is worth to recheck
        self.workflow.reload().then(function () {

            if(self.workflow.status == Workflow.statusCodes.CANCELLED || self.workflow.status == Workflow.statusCodes.ERROR){
                logger.debug('Cant continue: Töövoog on katkestatud');
                subStep.log = 'Töövoog on katkestatud';
                return self._updateSubstepFinishStatus(subStep, Workflow.statusCodes.CANCELLED, cb);
            }

            logger.debug('Recheck request on ' + response.response.recheckInterval);
            logger.debug(dto);
            logger.debug(response);

            setTimeout(function () {
                apiService.recheckRequest(dto, subStep.serviceSession, function (error, response) {
                    if(error){return cb(error)}
                    self._handleResponse(subStep, dto, response, cb);
                })
            }, response.response.recheckInterval * 1000);

        }).catch(function (err) {
            logger.error( err );
            callback(err.message);
        });
    };


    this._finishSubstepRequest = function (substep, dto, response, cb) {

        var filesData = response.response.data.files;

        async.waterfall([
            function loadOutputResources(callback) {
                async.eachSeries(
                    filesData,
                    function iterator(fileData, innerCb) {
                        self._loadOutputResource(substep, fileData, dto,  innerCb);
                    },
                    function done( err ) {
                        callback(err);
                    }
                );
            }
        ], function (err) {
            if(err){
                substep.log = err;
                return self._updateSubstepFinishStatus(substep, Workflow.statusCodes.ERROR, function (substep) {
                    logger.error('Substep finished with error:' + err);
                    cb(err, substep);
                });
            } else {
                return self._updateSubstepFinishStatus(substep, Workflow.statusCodes.FINISHED, function (err, substep) {
                    logger.debug('Finished: ' + substep.id);
                    cb(err, substep);
                });
            }
        });
    };

    this._loadOutputResource = function (substep, fileData, dto,  callback) {

        logger.debug('Load output resources');

        self._getSubstepOutputResourceType(substep, fileData, function (err, resourceType) {
            if(err){

                logger.debug('Skip: ', fileData);
                logger.debug('Skip error: ', err);

                return callback(null, substep); //SKIP if not used
            }
            var outputPath = self._getOutputResourcePath(substep, fileData);
            apiService.loadRequestResponse(dto, substep.serviceSession, fileData, outputPath, function (err) {
                self._addSubstepOutputResource(substep, outputPath, fileData, resourceType, function (err) {
                    logger.debug('Output resource added: ' +  substep.id);
                    callback(err);
                });
            });
        });
    };

    this._updateSubstepFinishStatus = function (substep, status, cb) {

        logger.debug('Update finish status: ' + status, substep.id);

        substep.status = status;
        substep.datetimeEnd = new Date();
        substep.save().then(function () {
            logger.debug('Update finish status Saved ');
            cb(null, substep);
        }).catch(function (err) {
            cb('Error happened', err.message);
        });
    };

    this._getOutputResourcePath = function ( substep, fileData) {

        var rootLocation = config.resources.location;
        if (!fs.existsSync( rootLocation )) {
            fs.mkdirSync( rootLocation );
        }

        var location = '/workflow_' + workflow.id;
        if (!fs.existsSync( rootLocation + location )) {
            fs.mkdirSync( rootLocation + location );
        }

        return location + '/substep_' + substep.id + '_' + fileData.key;
    };

    this._addSubstepOutputResource = function (substep, outputPath, fileData, resourceType, cb) {

        async.waterfall([
            function (callback) {
                self._getOutputResourceFilename(substep, fileData, resourceType, callback);
            },
            function (fileName, callback) {
                var data = {
                    filename: outputPath,
                    resourceTypeId: resourceType.id,
                    originalName: fileName,
                    name: fileName,
                    contentType: fileData.contentType
                };

                Resource.create(data).then(function (resource) {
                    callback(null, resource);
                }).catch(function (err) {
                    logger.error(err);
                    callback(err);
                });
            },
            function addSubStepResource(resource, callback) {

                var associationData = {
                    context: ResourceAssociation.contexts.SUBSTEP_OUTPUT,
                    resourceId: resource.id,
                    userId: workflow.userId,
                    projectId: project.id,
                    workflowId: workflow.id,
                    workflowServiceSubstepId: substep.id
                };

                resourceService.createAssociation( associationData, function (err, association) {
                    callback( err );
                });
            }
        ], function (err) {
            if(err){
                logger.error( err );
            }
            cb(err);
        });
    };

    this._getOutputResourceFilename = function (substep, fileData, resourceType, cb) {

        var sourceName;
        var name = FileUtil.normalizeFileName(fileData.fileName);

        async.waterfall([
            function (callback) {
                substep.getInputResources().then(function (resources) {
                    if(resources && resources.length > 0){
                        var resource = resources.pop();
                        sourceName = FileUtil.getSourceName(resource.originalName);
                    }
                    callback();
                });
            },
            function ( callback ){
                callback(null, sourceName + '.' + name);
            }
        ], cb);
    };

    this._getSubstepOutputResourceType = function(substep, fileData, cb){

        async.waterfall([
            function (callback) {
                substep.getWorkflowService().then(function (workflowService) {
                    callback(null, workflowService);
                });
            },
            function (workflowService, callback) {
                workflowService.getService().then(function (service) {
                    callback(null, service);
                });
            },
            function (service, callback) {
                service.getServiceOutputTypes({where: {key: fileData.key}}).then(function (types) {
                    callback(null, types.pop());
                });
            },
            function (outputType, callback) {
                if(!outputType){
                    return callback('Output type for key' + fileData.key +' not found');
                }
                outputType.getResourceType().then(function (resourceType) {
                    callback(null, resourceType);
                });
            }
        ], cb );
    };


    this.mapLastServiceSubstepResources = function (substep, callback) {

        if(substep == null){
            return callback();
        }

        substep.getResourceAssociations( { where: { context: ResourceAssociation.contexts.SUBSTEP_OUTPUT } })
            .then(function (outputAssociations) {
                async.each(outputAssociations, function (outputAssociation, innerCb) {

                    var associationData = {
                        context: ResourceAssociation.contexts.WORKFLOW_OUTPUT,
                        resourceId: outputAssociation.resourceId,
                        userId: outputAssociation.userId,
                        projectId: outputAssociation.projectId,
                        workflowId: outputAssociation.workflowId
                    };

                    resourceService.createAssociation(associationData, function (err, association) {
                        innerCb(err);
                    });

                }, function (err) {
                    if(err){
                        logger.error('Association mapping failed', err);
                    }
                    callback(err);
                });
            }
        ).catch(function (err) {
                callback(err.message);
            }
        );
    }
}

module.exports = SubStepHandler;