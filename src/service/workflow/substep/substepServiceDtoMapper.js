/**
 * Created by priit on 1.07.15.
 */
var logger = require('log4js').getLogger('substep_mapper');
var async = require('async');

function SubstepServiceDtoMapper(){

    var self = this;

    this.getSubstepServiceDto = function (workflowSubstep, cb) {

        var workflowService;
        var service;

        async.waterfall([
            function getWorkflowService(callback) {
                workflowSubstep.getWorkflowService().then(function (item) {
                    workflowService = item;
                    callback();
                }).catch(function (err) {
                    callback(err);
                });
            },
            function getService(callback) {
                workflowService.getService().then(function (serviceItem) {
                    service = serviceItem;
                    callback();
                }).catch(function (err) {
                    callback(err);
                });
            },
            function setDtoServiceParams(callback) {
                var dto = {};
                self._setDtoServiceParams(dto, service, workflowService, callback);
            },
            function setDtoInputResources(dto, callback) {
                self._setInputResources(dto, workflowSubstep, service, callback);
            }
        ], function (err, dto) {

            logger.debug('Made dto: ' + JSON.stringify(dto));

            cb(err, dto);
        });
    };

    this._setDtoServiceParams = function (dto, service, workflowService, callback) {
        dto.url = service.url;

        dto.params = {
            is_async: true // Default value. Can be overwritten
        };

        workflowService.getParamValues().then(function (paramValues) {
            async.each(paramValues, function (paramValue, valueCallback) {
                paramValue.getServiceParam().then(function (serviceParam) {
                    dto.params[serviceParam.key] = paramValue.value;
                    valueCallback();
                });
            }, function (err) {
                callback(err, dto);
            });
        });
    };

    this._setInputResources = function (dto, workflowSubstep, service, cb) {

        var resources;
        var inputTypes;
        dto.files = {};

        async.waterfall([
            function getInputResources(callback) {
                workflowSubstep.getInputResources().then(function (data) {
                    resources = data;
                    callback();
                });
            },
            function getRequiredInputTypes(callback) {
                service.getServiceInputTypes().then(function (data) {
                    inputTypes = data;
                    logger.info('Input types count: ' + inputTypes.length);
                    callback();
                });
            },
            function mapInputs(callback) {
                for(i in inputTypes){
                    var inputype = inputTypes[i];
                    for(j in resources){
                        var resource = resources[j];
                        if(inputype.resource_type_id == resource.resource_type_id){
                            logger.debug('Suitable input resource found: ' + resource.id);
                            logger.debug('Key: ' + inputype.key + ' Filename: ' + resource.filename);
                            dto.files[inputype.key] = resource.filename;
                        }
                    }
                }
                callback(null, dto);
            }
        ], function (err, dto) {
            if(err){
               logger.error( err );
            }
            cb(err, dto);
        });
    };
}

module.exports = new SubstepServiceDtoMapper();