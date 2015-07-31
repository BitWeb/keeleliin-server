/**
 * Created by priit on 2.07.15.
 */

var logger = require('log4js').getLogger('substep_runner');
var async = require('async');
var fs = require('fs');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var apiService = require('./../service/apiService');
var substepServiceDtoMapper = require('./substepServiceDtoMapper');
var config = require(__base + 'config');
var FileUtil = require('./../../../util/fileUtil');


function SubStepRunner(){

    var self = this;

    this.run = function (substep, cb) {

        async.waterfall([
            function setRunning(callback) {
                substep.status = 'RUNNING';
                substep.datetime_start = new Date();
                substep.save().then(function (substep){
                    callback(null, substep);
                }).catch(function (err) {
                    logger.error('Save step error', err);
                    callback(err.message);
                });
            },
            function getDto(substep, callback) {
                substepServiceDtoMapper.getSubstepServiceDto(substep, callback);
            },
            function (dto, callback) {
                self.startProcessing(substep, dto, callback);
            }
        ], function (err) {
            if(err){
                logger.error(err);
                substep.log = err;
                return self._updateSubstepFinishStatus(substep, WorkflowServiceSubstep.statusCodes.ERROR, cb);
            }

            cb(null, substep);
        });
    };

    this.startProcessing = function (substep, dto, cb){
        apiService.makeRequest(dto, function (err, response) {
            if(err){ return cb(err); }
            logger.debug(response);
            self.handleResponse(substep, dto, response, cb);
        });
    };

    this.handleResponse = function (substep, dto, response, cb){

        if(!response || !response.response){
            logger.error('TODO:: No response');
            substep.log = 'No service response';
            return self._updateSubstepFinishStatus(substep, WorkflowServiceSubstep.statusCodes.ERROR, cb);
        }

        substep.service_session = response.response.serviceId;

        if(response.response.message == 'OK') {
            logger.info('Message OK');
            self._finishSubstepRequest(substep, dto, response, cb);
        } else if(response.response.message == 'RUNNING'){
            logger.info('Message RUNNING');
            self._recheckRequest(substep, dto, response, cb);
        } else if(response.response.message == 'ERROR'){
            logger.info('Message ERROR');
            logger.error(response.response);
            substep.log = 'Got service error: ' + JSON.stringify(response.response.errors);
            self._updateSubstepFinishStatus(substep, WorkflowServiceSubstep.statusCodes.ERROR, cb);
        } else {
            logger.error('TODO:: Not OK');
            substep.log = 'No service response message not mapped: ' + response.response.message;
            self._updateSubstepFinishStatus(substep, WorkflowServiceSubstep.statusCodes.ERROR, cb);
        }
    };

    this._recheckRequest = function (substep, dto, response, cb) {
        logger.debug('Recheck request on ' + response.response.recheckInterval);
        logger.debug(dto);
        logger.debug(response);

        setTimeout(function () {
            apiService.recheckRequest(dto, response.response.serviceId, function (error, response) {
                if(error){return cb(error)}
                self.handleResponse(substep, dto, response, cb);
            })
        }, response.response.recheckInterval);
    };


    this._finishSubstepRequest = function (substep, dto, response, cb) {
        var files =  response.response.data.files;
        async.waterfall([
            function getWorkflowId(wfCallback) {
                substep.getWorkflowService().then(function (workflowService) {
                    wfCallback(null, workflowService.workflow_id);
                }).catch(wfCallback);
            },
            function loadOutputResources(workflowId, wfCallback) {
                async.eachSeries(
                    files,
                    function iterator(fileData, callback) {
                        self.getSubstepOutputResourceType(substep, fileData, function (err, resourceType) {
                           if(err) return callback(null, substep); //SKIP if not used

                            var outputPath = self.getOutputResourcePath(substep, fileData, workflowId);
                            var requestSessionId = response.response.serviceId;
                            apiService.loadRequestResponse(dto, requestSessionId, fileData, outputPath, function (err) {
                                self.addSubstepOutputResource(substep, outputPath, fileData, resourceType, function (err, updatedSubstep) {
                                    substep = updatedSubstep;
                                    logger.debug('Output resource added: ' +  updatedSubstep.id);
                                    callback(err, substep);
                                });
                            });
                        });
                    },
                    function done( err ) {
                    wfCallback(err, substep);
                });
            },
            function setFinishStatus(substep, wfCallback) {
                self._updateSubstepFinishStatus(substep, WorkflowServiceSubstep.statusCodes.FINISHED, wfCallback);
            }
        ], function (err, data) {
            logger.debug('Finished: ' + substep.id);
            cb(err, data);
        });
    };

    this._updateSubstepFinishStatus = function (substep, status, cb) {
        substep.status = status;
        substep.datetime_end = new Date();
        substep.save().then(function (substep) {
            cb(null, substep);
        }).catch(cb);
    };

    this.getOutputResourcePath = function ( substep, fileData, workflowId) {

        var rootLocation = config.resources.location;
        if (!fs.existsSync( rootLocation )) {
            fs.mkdirSync( rootLocation );
        }

        var location = '/workflow_' + workflowId;
        if (!fs.existsSync( rootLocation + location )) {
            fs.mkdirSync( rootLocation + location );
        }

        return location + '/substep_' + substep.id + '_' + fileData.key;
    };

    this.addSubstepOutputResource = function (substep, outputPath, fileData, resourceType, cb) {

        async.waterfall([
            function (callback) {
                self.getOutputResourceFilename(substep, fileData, resourceType, callback);
            },
            function (fileName, callback) {
                var data = {
                    filename: outputPath,
                    file_type: Resource.fileTypes.FILE,
                    resource_type_id: resourceType.id,
                    original_name: fileName,
                    name: fileName,
                    content_type: fileData.contentType
                };
                callback(null, data);
            },
            function createResource(data, callback) {
                Resource.build(data).save().then(function (resource) {
                    callback(null, resource);
                }).catch(function (err) {
                    logger.error(err);
                    callback(err);
                });
            },
            function addSubstepResource(resource, callback) {
                substep.addOutputResource(resource).then(function () {
                    callback(null, substep);
                });
            }
        ], cb);
    };

    this.getOutputResourceFilename = function (substep, fileData, resourceType, cb) {

        var sourceName;
        var name = FileUtil.normalizeFileName(fileData.fileName);

        async.waterfall([
            function (callback) {
                substep.getInputResources().then(function (resources) {
                    if(resources && resources.length > 0){
                        var resource = resources.pop();
                        sourceName = FileUtil.getName(resource.original_name)
                    }
                    callback(null, name);
                });
            },
            function ( callback ){
                callback(null, sourceName + '.' + name);
            }
        ], cb);
    };

    this.getSubstepOutputResourceType = function(substep, fileData, cb){

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
                service.getServiceOutputTypes({where: {key: fileData.type}}).then(function (types) {
                    callback(null, types.pop());
                });
            },
            function (outputType, callback) {
                if(!outputType){
                    return callback('Output type for key' + fileData.type +' not found');
                }
                outputType.getResourceType().then(function (resourceType) {
                    callback(null, resourceType);
                });
            }
        ], cb );
    };


}

module.exports = new SubStepRunner();