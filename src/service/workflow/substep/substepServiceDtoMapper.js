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
            function (callback) {
                workflowSubstep.getWorkflowService().then(function (item) {
                    workflowService = item;
                    callback();
                }).catch(function (err) {
                    logger.error(err);
                    callback(err);
                });
            },
            function (callback) {

                workflowService.getService().then(function (serviceItem) {
                    service = serviceItem;
                    self.setDtoServiceParams({}, service, workflowService, callback);
                });
            }, function (dto, callback) {
                workflowSubstep.getInputResources().then(function (resources) {
                    self.setDtoFiles(dto, service, resources, callback);
                });
            }
        ], function (err, dto) {
            cb(err, dto);
        });
    };

    this.setDtoServiceParams = function (dto, service, workflowService, callback) {
        dto.url = service.url;
        dto.params = {};
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

    this.setDtoFiles = function (dto, service, resources, cb) {
        dto.files = {};
        service.getServiceInputTypes().then(function (inputypes) {

            logger.error('COMP');
            logger.error(inputypes);

            for(i in inputypes){
                var inputype = inputypes[i];
                for(j in resources){

                    logger.error('COMP');

                    var resource = resources[j];
                    if(inputype.resource_type_id == resource.resource_type_id){
                        dto.files[inputype.key] = __base + resource.filename;
                    }
                }
            }
            cb(null, dto);
        });
    };
}

module.exports = new SubstepServiceDtoMapper();