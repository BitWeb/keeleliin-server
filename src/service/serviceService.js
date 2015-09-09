/**
 * Created by taivo on 15.06.15.
 */
var logger = require('log4js').getLogger('service_service');
var PaginationUtil = require(__base + 'src/util/paginationUtil');
var serviceDaoService = require(__base + 'src/service/dao/serviceDaoService');
var ServiceModel = require(__base + 'src/service/dao/sql').Service;
var ServiceModelParam = require(__base + 'src/service/dao/sql').ServiceParam;
var ParamOption = require(__base + 'src/service/dao/sql').ParamOption;
var ServiceOutputType = require(__base + 'src/service/dao/sql').ServiceOutputType;
var ServiceInputType = require(__base + 'src/service/dao/sql').ServiceInputType;
var ArrayUtils = require(__base + 'src/util/arrayUtils');
var async = require('async');
var resourceService = require(__base + 'src/service/resourceService');
var ServiceForm = require(__base + 'src/form/serviceForm');
var sequelize = require(__base + 'src/service/dao/sql').sequelize;

function ServiceService() {

    var self = this;

    this.getServicesList = function(req, callback) {
        return serviceDaoService.getServicesList(callback);
    };

    this.getServicesDetailedList = function(req, callback) {
        return serviceDaoService.getServicesDetailedList(function (err, data) {
            if(err){
                return callback(err);
            }

            var result = [];
            for(i in data){
                var item = data[i];
                var itemJSON = item.toJSON();

                itemJSON.childServices = itemJSON.childServices.map(function (serviceItem) {
                    return serviceItem.id;
                });
                itemJSON.parentServices = itemJSON.parentServices.map(function (serviceItem) {
                    return serviceItem.id;
                });

                result.push(itemJSON);
            }

            callback( null, result);
        });
    };

    this.getServiceEditData = function (req, serviceId, cb) {

        serviceDaoService.getServiceEditData(serviceId, function (err, data) {
            if(err){
                return cb(err);
            }

            //map parentservices to simple list
            var dataJSON = data.toJSON();
            var parentServicesList = [];
            for(i in dataJSON.parentServices){
                parentServicesList.push( dataJSON.parentServices[i].id );
            }
            dataJSON.parentServices = parentServicesList;
            return cb(null, dataJSON);
        });
    };

    this.toggleServiceStatus = function (req, serviceId, cb) {

        async.waterfall([
            function (callback) {
                serviceDaoService.findService(serviceId, callback);
            },
            function (serviceInstance, callback) {

                if(serviceInstance.isActive){
                    serviceInstance.isActive = false;
                } else {
                    serviceInstance.isActive = true;
                }

                serviceInstance.save().then(function () {
                    callback(null, serviceInstance);
                });
            }
        ], cb);
    };

    this.updateService = function(req, serviceId, serviceData, cb) {

        async.waterfall([
            function getService( callback ) {
                self.getService( serviceId, callback);
            },
            function(serviceInstance, callback) {
                serviceInstance.updateAttributes(serviceData, {fields:['name', 'description', 'url','sid','isSynchronous','isActive']}).then(function() {
                    return callback(null, serviceInstance);
                }).catch(function(error) {
                    return callback(error);
                });
            },
            function(serviceInstance, callback) {
                self._updateServiceRelations(req, serviceData, serviceInstance, callback);
            }
        ], function (err, serviceInstance) {
            if(err){
                logger.error(err);
                return cb(err);
            }
            self.getServiceEditData(req, serviceInstance.id, cb);
        });
    };

    this.getService = function( serviceId, callback) {
        return serviceDaoService.findService(serviceId, callback);
    };


    this.createService = function(req, serviceData, cb) {
        var service = null;
        async.waterfall([
            function(callback) {
                ServiceModel.create(serviceData, {fields:['name', 'description', 'url','sid','isSynchronous','isActive']}).then(function(serviceModel) {
                    service = serviceModel;
                    return callback();
                }).catch(function(error) {
                    return callback(error.message);
                });
            },
            function(callback) {
                self._updateServiceRelations(req, serviceData, service, callback);
            }
        ], function(error, serviceModel) {

            if(error){
                logger.error(error);
            }

            if (error && service) {
                // Rollback, manually removing incomplete service
                // There exists transaction implementation, but too tedious to use it for creating service
                ServiceModel.destroy({where: {id: service.id}}).then(function() {
                    return cb(error);
                }).catch(function(error) {
                    return cb(error.message, serviceModel);
                });
            } else {
                return cb(error, serviceModel);
            }
        });
    };

    this._updateServiceRelations = function (req, serviceData, serviceInstance, cb) {
        async.waterfall([
            function(callback) {
                self._updateServiceParamValues(req, serviceData, serviceInstance, callback);
            },
            function(serviceInstance, callback) {
                self._updateServiceInputTypes(req, serviceData, serviceInstance, callback);
            },
            function(serviceInstance, callback) {
                self._updateServiceOutputTypes(req, serviceData, serviceInstance, callback);
            },
            function(serviceInstance, callback) {
                self._updateServiceParentServices(req, serviceData, serviceInstance, callback);
            }
        ], cb);
    };

    this._updateServiceParamValues = function(req, serviceData, serviceInstance, cb) {

        var existingParamsIds = [];
        var updatedParamsIds = [];

        async.waterfall([
            function getExistingParams(callback) {
                serviceInstance.getServiceParams().then(function(existingParams) {
                    existingParamsIds = existingParams.map(function (item) {
                        return item.id;
                    });
                    logger.debug('found ' + existingParams.length + ' existing params: ');
                    return callback(null, existingParams);
                });
            },
            function updateOrAddParams(existingParams, callback ) {
                logger.debug('Update or add params: ', serviceData.serviceParams);
                serviceData.serviceParams = serviceData.serviceParams ? serviceData.serviceParams : [];

                async.eachSeries(serviceData.serviceParams, function(serviceParamData, innerCallback) {
                    logger.debug('Update data: ', serviceParamData);

                    var existingParam = ArrayUtils.find(existingParams, function (item) {
                       return item.id == serviceParamData.id
                    });

                    self._updateOrCreateServiceParam(req, existingParam, serviceParamData, serviceInstance, function (err, serviceParam) {
                       if(err){
                           return innerCallback(err);
                       }
                        updatedParamsIds.push( serviceParam.id );
                        innerCallback();
                    });
                }, callback);
            },
            function removeServiceDeletedParams(callback) {
                var removableIds = ArrayUtils.arrayDiff(existingParamsIds, updatedParamsIds);
                if (removableIds.length > 0) {
                    ServiceModelParam.destroy({where: {id: removableIds}}).then(function() {
                        return callback(null, serviceInstance);
                    }).catch(function(error) {
                        return callback(error);
                    });
                } else {
                    return callback(null, serviceInstance);
                }
            }
        ], cb);
    };

    this._updateOrCreateServiceParam = function ( req, serviceParam, serviceParamData, serviceInstance, cb) {

        if(!serviceParam){
            serviceParam = ServiceModelParam.build(serviceParamData, {fields:['type', 'key', 'value','isEditable','description']});
        }

        serviceInstance.addServiceParam(serviceParam).then(function() {
            logger.debug('New param added');
            return self._updateServiceParamOptions( serviceParam, serviceParamData, cb);
        }).catch(function(err) {
            return cb(err);
        });
    };

    this._updateServiceParamOptions = function ( serviceParam, serviceParamData, cb ) {

        logger.debug('Update or create param options: ', serviceParamData);
        var existingOptionsIds = [];
        var updatedOptionsIds = [];
        var optionsData = serviceParamData.paramOptions ? serviceParamData.paramOptions : [];

        async.waterfall([
            function getExisting(callback) {
                serviceParam.getParamOptions().then(function (options) {
                    existingOptionsIds = options.map(function (item) {
                        return item.id;
                    });
                    callback(null, options);
                });
            },
            function updateOrCreate(existingOptions, callback) {

                async.eachSeries(optionsData, function (optionData, innerCallback) {
                    logger.debug('Update or create option: ', optionData);
                    if(optionData.id){
                        var existingOption = ArrayUtils.find(existingOptions, function (item) {
                            return item.id == optionData.id;
                        });
                        existingOption.updateAttributes(optionData, {fields: ['label', 'value']}).then(function () {
                            updatedOptionsIds.push(existingOption.id);
                            return innerCallback();
                        }).catch(function (err) {
                            return innerCallback(err.message);
                        });
                    } else {
                        var optionInstance = ParamOption.build(optionData, {fields: ['label', 'value']});
                        serviceParam.addParamOption(optionInstance).then(function () {
                            updatedOptionsIds.push(optionInstance.id);
                            return innerCallback();
                        }).catch(function (err) {
                            return innerCallback(err.message);
                        });
                    }
                }, callback);
            },
            function deleteRemovedOptions(callback) {

                var removableIds = ArrayUtils.arrayDiff(existingOptionsIds, updatedOptionsIds);
                if (removableIds.length > 0) {
                    ParamOption.destroy({where: {id: removableIds}}).then(function() {
                        return callback(null);
                    }).catch(function(error) {
                        return callback(error);
                    });
                } else {
                    return callback(null);
                }
            }
        ], function (err) {
            cb(err, serviceParam);
        });
    };

    this._updateServiceInputTypes = function(req, serviceData, serviceInstance, cb) {

        var existingTypesIds = [];
        var addedTypesIds = [];

        async.waterfall([
            function getExisting(callback) {
                serviceInstance.getServiceInputTypes().then(function(serviceInputTypes) {
                    existingTypesIds = serviceInputTypes.map(function (item) {
                        return item.id;
                    });
                    return callback(null, serviceInputTypes);
                });
            },

            function update(existingTypes, callback ) {

                async.eachSeries(serviceData.serviceInputTypes, function(serviceInputTypeData, innerCallback) {

                    var inputType;

                    if(serviceInputTypeData.id){
                        inputType = ArrayUtils.find(existingTypes, function (item) {
                            return item.id == serviceInputTypeData.id
                        });
                    }

                    if(inputType){
                        inputType.updateAttributes(serviceInputTypeData, {fields: ['key','doParallel','sizeLimit','sizeUnit','resourceTypeId']}).then(function () {
                            addedTypesIds.push(inputType.id);
                            innerCallback();
                        }).catch(function (err) {
                            innerCallback(err.message);
                        });
                    } else {
                        inputType = ServiceInputType.build(serviceInputTypeData, {fields: ['key','doParallel','sizeLimit','sizeUnit','resourceTypeId']});
                        serviceInstance.addServiceInputType(inputType).then(function () {
                            addedTypesIds.push(inputType.id);
                            innerCallback();
                        }).catch(function (err) {
                            innerCallback(err.message);
                        });
                    }
                }, callback);
            },
            function removeDeleted( callback ) {
                var removableIds = ArrayUtils.arrayDiff(existingTypesIds, addedTypesIds);
                if (removableIds.length > 0) {
                    ServiceInputType.destroy({
                        where: {id: removableIds}
                    }).then(function() {
                        return callback(null, serviceInstance);
                    }).catch(function(error) {
                        return callback(error);
                    });
                } else {
                    return callback(null, serviceInstance);
                }
            }
        ], cb);
    };

    this._updateServiceOutputTypes = function(req, serviceData, serviceInstance, cb) {

        var existingTypesIds = [];
        var addedTypesIds = [];

        async.waterfall([
            function(callback) {
                serviceInstance.getServiceOutputTypes().then(function(serviceOutputTypes) {
                    existingTypesIds = serviceOutputTypes.map(function (item) {
                        return item.id;
                    });

                    return callback(null, serviceOutputTypes);
                });
            },

            function(existingTypes, callback) {

                async.eachSeries(serviceData.serviceOutputTypes, function(serviceOutputTypeData, innerCallback) {

                    var outputType;

                    if(serviceOutputTypeData.id){
                        outputType = ArrayUtils.find(existingTypes, function (item) {
                            return item.id == serviceOutputTypeData.id
                        });
                    }

                    if(outputType){
                        outputType.updateAttributes(serviceOutputTypeData, {fields: ['key','resourceTypeId']}).then(function () {
                            addedTypesIds.push(outputType.id);
                            innerCallback();
                        }).catch(function (err) {
                            innerCallback(err.message);
                        });
                    } else {
                        outputType = ServiceOutputType.build(serviceOutputTypeData, {fields: ['key','resourceTypeId']});
                        serviceInstance.addServiceOutputType(outputType).then(function () {
                            addedTypesIds.push(outputType.id);
                            innerCallback();
                        }).catch(function (err) {
                            innerCallback(err.message);
                        });
                    }
                }, callback);
            },
            function( callback ) {
                var removableIds = ArrayUtils.arrayDiff(existingTypesIds, addedTypesIds);
                if (removableIds.length > 0) {
                    ServiceOutputType.destroy({
                        where: {id: removableIds}
                    }).then(function() {
                        return callback(null, serviceInstance);
                    }).catch(function(error) {
                        return callback(error);
                    });
                } else {
                    return callback(null, serviceInstance);
                }
            }
        ], cb);
    };

    this._updateServiceParentServices = function(req, serviceData, serviceInstance, cb) {

        ServiceModel.findAll({ where: {id: serviceData.parentServices}}).then(function (parentServices) {
                serviceInstance.setParentServices( parentServices).then(function () {
                    cb(null, serviceInstance);
                }).catch(function (err) {
                    cb(err.message);
                });
            })
            .catch(function (err) {
                cb(err.message);
            });
    };

    this.installService = function(req, sid, serviceData, callback) {
        self.getServiceBySid(req, sid, function(error, serviceModel) {
            if (error) {
                return callback(error);
            }

            if (serviceModel) {
                return callback('Service already installed.', serviceModel);
            }

            self._composeServiceDataFromInstallServiceData(sid, serviceData, function(error, data) {
                if (error) {
                    return callback(error);
                }

                var serviceForm = new ServiceForm(data);
                if (serviceForm.isValid()) {
                    return self.createService(req, serviceForm.getData(), callback);
                } else {
                    return callback(serviceForm.errors);
                }
            });
        });
    };

    this.getServiceBySid = function(req, sid, callback) {

        ServiceModel.find({where: {sid: sid}}).then(function(serviceModel) {
            return callback(null, serviceModel);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this._composeServiceDataFromInstallServiceData = function(sid, installData, cb) {

        var serviceData = {
            name: installData.name,
            url: installData.url,
            sid: sid,
            description: installData.description,
            serviceParams: [],
            serviceInputTypes: [],
            serviceOutputTypes: []
        };

        async.waterfall([
            function(callback) {
                for (var i = 0; i < installData.parameters.length; i++) {
                    var param = installData.parameters[i];
                    serviceData.serviceParams.push({
                        type: param.type,
                        key: param.key,
                        value: param.value
                    });
                }
                callback();
            },
            function(callback) {
                if (installData.inputTypes) {
                    async.eachSeries(installData.inputTypes, function(inputType, innerCallback) {
                        resourceService.getResourceTypeByValue(inputType.type, function(error, resourceType) {
                            if (error) {
                                return innerCallback(error);
                            }

                            if (!resourceType) {
                                resourceService.createResourceType({
                                    value: inputType.type,
                                    name: inputType.type
                                }, function(error, resourceType) {
                                    if (error) {
                                        return innerCallback(error);
                                    }
                                    serviceData.serviceInputTypes.push({
                                        key: inputType.key,
                                        resourceTypeId: resourceType.id,
                                        sizeLimit: inputType.sizeLimit,
                                        sizeUnit: inputType.sizeUnit,
                                        isList: inputType.isList
                                    });
                                    innerCallback();
                                });
                            } else {
                                serviceData.serviceInputTypes.push({
                                    key: inputType.key,
                                    resourceTypeId: resourceType.id,
                                    sizeLimit: inputType.sizeLimit,
                                    sizeUnit: inputType.sizeUnit,
                                    isList: inputType.isList
                                });
                                innerCallback();
                            }


                        });
                    }, function(error) {
                        if (error) {
                            return callback(error);
                        }
                        return callback();
                    });
                } else {
                    return callback();
                }
            },

            function(callback) {
                if (installData.outputTypes) {
                    async.eachSeries(installData.outputTypes, function(outputType, innerCallback) {
                        resourceService.getResourceTypeByValue(inputType.type, function(error, resourceType) {
                            if (error) {
                                return innerCallback(error);
                            }

                            if (!resourceType) {
                                resourceService.createResourceType({
                                    value: outputType.type,
                                    name: outputType.type
                                }, function(error, resourceType) {
                                    if (error) {
                                        return innerCallback(error);
                                    }
                                    serviceData.serviceOutputTypes.push({
                                        resourceTypeId: resourceType.id,
                                        key: resourceType.key
                                    });
                                    innerCallback();
                                });
                            } else {
                                serviceData.serviceInputTypes.push({
                                    resourceTypeId: resourceType.id,
                                    key: resourceType.key
                                });
                                innerCallback();
                            }


                        });
                    }, function(error) {
                        if (error) {
                            return callback(error);
                        }
                        return callback();
                    });
                } else {
                    return callback();
                }
            }
        ], function(error) {
            if (error) {
                return cb(error);
            }
            return cb(null, serviceData);
        });
    };



}

module.exports = new ServiceService();