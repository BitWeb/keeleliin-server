/**
 * Created by priit on 2.07.15.
 */

var logger = require('log4js').getLogger('substep_runner');
var async = require('async');
var fs = require('fs');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var resourceDaoService = require(__base + 'src/service/dao/resourceDaoService');
var apiService = require('./../service/apiService');
var substepServiceDtoMapper = require('./substepServiceDtoMapper');
var config = require(__base + 'config');

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
                    logger.error('Save step error');
                    logger.error(err);
                });
            },
            function getDto(substep, callback) {
                substepServiceDtoMapper.getSubstepServiceDto(substep, callback);
            },
            function (dto, callback) {
                self.makeRequest(substep, dto, callback);
            }
        ], function (err, substep) {
            if(err) logger.error(err);
            cb(err, substep);
        });
    };

    this.makeRequest = function (substep, dto, cb){
        //execute service
        apiService.makeRequest(dto, function (err, response) {
            logger.debug(response);
            self.handleResponse(substep, dto, response, cb);
        });

    };

    this.recheckRequest = function () {
        //todo
    };

    this.handleResponse = function (substep, dto, response, cb){


        if(! response.response){
            logger.error('TODO:: No response');
            self._updateSubstepFinishStatus(substep, WorkflowServiceSubstep.statusCodes.ERROR, cb);
        }else if(response.response.message == 'OK') {
            logger.info('Message OK');
            self._finishSubstepRequest(substep, dto, response, cb);
        } else if(response.response.message == 'RUNNING'){
            //todo
        } else {
            logger.error('TODO:: Not OK');
            self._updateSubstepFinishStatus(substep, WorkflowServiceSubstep.statusCodes.ERROR, cb);
        }
    };

    this._finishSubstepRequest = function (substep, dto, response, cb) {
        var fileKeys =  response.response.data.files;

        async.waterfall([
            function getWorkflowId(wfCallback) {
                substep.getWorkflowService().then(function (workflowService) {
                    wfCallback(null, workflowService.workflow_id);
                }).catch(wfCallback);
            },
            function loadOutputResources(workflowId, wfCallback) {
                async.eachSeries(
                    fileKeys,
                    function iterator(fileKey, callback) {

                        self.getSubstepOutputResourceType(substep, fileKey, function (err, resourceType) {
                           if(err) return callback(null, substep); //SKIP if not used

                            var outputPath = self.getOutputResourcePath(substep, fileKey, workflowId);
                            var requestSessionId = response.response.serviceId;
                            apiService.loadRequestResponse(dto, requestSessionId, fileKey, outputPath, function (err) {
                                self.addSubstepOutputResource(substep, outputPath, fileKey, resourceType, function (err, updatedSubstep) {
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
            logger.error('Finished');
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

    this.getOutputResourcePath = function ( substep, filekey, workflowId) {

        var rootLocation = config.resources.location;
        if (!fs.existsSync( rootLocation )) {
            fs.mkdirSync( rootLocation );
        }

        var location = '/workflow_' + workflowId;
        if (!fs.existsSync( rootLocation + location )) {
            fs.mkdirSync( rootLocation + location );
        }

        return location + '/substep_' + substep.id + '_' + filekey;
    };

    this.addSubstepOutputResource = function (substep, outputPath, fileKey, resourceType, cb) {

        var data = {
            filename: outputPath,
            file_type: Resource.fileTypes.FILE,
            resource_type_id: resourceType.id,
            source_original_name: fileKey,
            source_filename: fileKey,
            name: fileKey
        };

        async.waterfall([
            function createResource(callback) {
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

    this.getSubstepOutputResourceType = function(substep, fileKey, cb){

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
                service.getServiceOutputTypes({where: {key: fileKey}}).then(function (types) {
                    callback(null, types.pop());
                });
            },
            function (outputType, callback) {
                if(!outputType){
                    return callback('Output type for key' + fileKey +' not found');
                }
                outputType.getResourceType().then(function (resourceType) {
                    callback(null, resourceType);
                });
            }
        ], cb );
    };

}

module.exports = new SubStepRunner();