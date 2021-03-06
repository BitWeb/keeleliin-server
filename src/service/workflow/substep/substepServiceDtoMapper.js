/**
 * Created by priit on 1.07.15.
 */
var logger = require('log4js').getLogger('substep_service_dto_mapper');
var async = require('async');
var ResourceAssociation = require(__base + 'src/service/dao/sql').ResourceAssociation;

function SubstepServiceDtoMapper(){

    var self = this;

    this.getSubstepServiceDto = function (workflowSubstep, cb) {

        var workflowService;
        var service;

        async.waterfall([
            function getWorkflowService(callback) {
                workflowSubstep.getWorkflowService().then(function (item) {
                    if(!item){
                        return callback('Workflow service not found');
                    }
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
            if(err){
                logger.error(err);
                return cb( err );
            }
            logger.debug('Made dto: ' + JSON.stringify(dto));

            cb(null, dto);
        });
    };

    this._setDtoServiceParams = function (dto, service, workflowService, callback) {
        dto.url = service.url;

        dto.params = {
            isAsync: 1 // Default value. Can be overwritten
        };

        var values = workflowService.serviceParamsValues;

        service.getServiceParams().then(function (serviceParams) {
            async.each(serviceParams, function (serviceParam, valueCallback) {

                if(!values || !values[serviceParam.key] || serviceParam.isEditable == false ){
                    dto.params[serviceParam.key] = serviceParam.value;
                } else {
                    dto.params[serviceParam.key] = values[serviceParam.key];
                }

                return valueCallback();

            }, function (err) {
                callback(err, dto);
            });
        });
    };

    this._setInputResources = function (dto, workflowSubstep, service, cb) {

        var resources;
        var inputTypes;
        dto.files = [];

        async.waterfall([
            function getInputResources(callback) {
                workflowSubstep.getInputResources({
                    through:{
                        attributes:[]
                    }
                }).then(function (data) {
                    logger.debug('Substep ' + workflowSubstep.id + ' input resources count ' + data.length );
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

                try {
                    for(var i in inputTypes){

                        if (!inputTypes.hasOwnProperty(i)) {
                            continue;
                        }

                        var inputype = inputTypes[i];

                        var sizeLeft = null;
                        if(inputype.sizeLimit !== 0 && !isNaN(parseInt(inputype.sizeLimit, 10))){
                            sizeLeft = inputype.sizeLimit;
                        }

                        for(var j in resources){

                            if (!resources.hasOwnProperty(j)) {
                                continue;
                            }

                            var resource = resources[j];
                            logger.debug(' Compare: ' + inputype.resourceTypeId + ' == ' + resource.resourceTypeId );
                            if(inputype.resourceTypeId == resource.resourceTypeId){
                                logger.debug('Suitable input resource found: ' + resource.id);
                                logger.debug('Key: ' + inputype.key + ' Filename: ' + resource.filename);

                                if(sizeLeft !== null){
                                    sizeLeft = sizeLeft - resource.fileSize;
                                    if(sizeLeft < 0){
                                        return callback('Teenusele etteantavate ressursside maht ületati ( limiit '+ inputype.sizeLimit +' baiti )');
                                    }
                                }

                                dto.files.push({
                                    key: inputype.key,
                                    path: resource.filename
                                });
                            }
                        }
                    }
                }catch ( e ){
                    logger.error(e);
                    return callback(e);
                }

                logger.debug('Inputs are mapped');

                return callback(null, dto);
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