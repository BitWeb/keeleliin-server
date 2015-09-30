/**
 * Created by taivo on 15.06.15.
 */
var logger = require('log4js').getLogger('service_service');
var PaginationUtil = require(__base + 'src/util/paginationUtil');
var serviceDaoService = require(__base + 'src/service/dao/serviceDaoService');
var ServiceModel = require(__base + 'src/service/dao/sql').Service;
var ServiceModelParam = require(__base + 'src/service/dao/sql').ServiceParam;
var ParamOption = require(__base + 'src/service/dao/sql').ParamOption;
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;
var ServiceOutputType = require(__base + 'src/service/dao/sql').ServiceOutputType;
var ServiceInputType = require(__base + 'src/service/dao/sql').ServiceInputType;
var ArrayUtils = require(__base + 'src/util/arrayUtils');
var async = require('async');
var resourceService = require(__base + 'src/service/resourceService');
var resourceTypeService = require(__base + 'src/service/resourceTypeService');
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

            var childServicesList = [];
            for(i in dataJSON.childServices){
                childServicesList.push( dataJSON.childServices[i].id );
            }
            dataJSON.childServices = childServicesList;

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
                self._updateServiceRelations( serviceData, serviceInstance, callback);
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
                self._updateServiceRelations( serviceData, service, callback);
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

    this._updateServiceRelations = function ( serviceData, serviceInstance, cb) {
        async.waterfall([
            function(callback) {
                self._updateServiceParamValues( serviceData, serviceInstance, callback);
            },
            function(serviceInstance, callback) {
                self._updateServiceInputTypes( serviceData, serviceInstance, callback);
            },
            function(serviceInstance, callback) {
                self._updateServiceOutputTypes( serviceData, serviceInstance, callback);
            },
            function(serviceInstance, callback) {
                self._updateServiceParentServices( serviceData, serviceInstance, callback);
            },
            function(serviceInstance, callback) {
                self._updateServiceChildServices( serviceData, serviceInstance, callback);
            }
        ], cb);
    };

    this._updateServiceParamValues = function( serviceData, serviceInstance, cb) {

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

                    self._updateOrCreateServiceParam( existingParam, serviceParamData, serviceInstance, function (err, serviceParam) {
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

    this._updateOrCreateServiceParam = function ( serviceParam, serviceParamData, serviceInstance, cb) {

        if( serviceParam ){
            serviceParam.updateAttributes(serviceParamData, {fields:['type', 'key', 'value','isEditable','description']}).then(function () {
                return self._updateServiceParamOptions( serviceParam, serviceParamData, cb);
            }).catch(function(err) {
                return cb(err);
            });
        } else {
            serviceParam = ServiceModelParam.build(serviceParamData, {fields:['type', 'key', 'value','isEditable','description']});
            serviceInstance.addServiceParam(serviceParam).then(function() {
                logger.debug('New param added');
                return self._updateServiceParamOptions( serviceParam, serviceParamData, cb);
            }).catch(function(err) {
                return cb(err);
            });
        }
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

    this._updateServiceInputTypes = function( serviceData, serviceInstance, cb) {

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

    this._updateServiceOutputTypes = function( serviceData, serviceInstance, cb) {

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

    this._updateServiceParentServices = function( serviceData, serviceInstance, cb) {
        logger.debug('Update parent services: ', serviceData.parentServices);
        ServiceModel.findAll({ where: {id: serviceData.parentServices}}).then(function (parentServices) {
                serviceInstance.setParentServices( parentServices).then(function () {
                    logger.debug('Update parent services updated: ', parentServices.length);
                    return cb(null, serviceInstance);
                }).catch(function (err) {
                    return cb(err.message);
                });
            })
            .catch(function (err) {
                return cb(err.message);
            });
    };

    this._updateServiceChildServices = function( serviceData, serviceInstance, cb) {
        logger.debug('Update child services: ', serviceData.childServices);
        ServiceModel.findAll({ where: {id: serviceData.childServices}}).then(function (childServices) {
            serviceInstance.setChildServices( childServices).then(function () {
                logger.debug('Update child services finished: ', childServices.length);
                return cb(null, serviceInstance);
            }).catch(function (err) {
                return cb(err.message);
            });
        })
            .catch(function (err) {
                return cb(err.message);
            });
    };

    this.installService = function(req, serviceData, cb) {

        async.waterfall([
            function checkIfInstalled(callback) {
                ServiceModel.find({where: {sid: serviceData.sid}}).then(function(serviceModel) {
                    if(serviceModel){
                        logger.trace('Service already installed');
                        return callback('Service already installed');
                    }
                    return callback();
                }).catch(function(error) {
                    return callback( error.message );
                });
            },
            function (callback) {
                logger.debug('Compose data');
                self._composeServiceDataFromInstallServiceData( serviceData, function(error, data) {
                    if (error) {
                        return callback(error);
                    }

                    var serviceForm = new ServiceForm(data);
                    if (serviceForm.isValid()) {
                        logger.debug('Create service');
                        return self.createService(req, serviceForm.getData(), callback);
                    } else {
                        return callback(serviceForm.errors);
                    }
                });
            }
        ], function (err, service) {
            if(err){
                logger.trace(err)
            }
            cb(err, service);
        });
    };

    /*

     sid: 'concat',
     name: 'Konkateneerija',
     url: 'http://localhost:3000/api/v1/',
     inputTypes:
     [ { key: 'content',
     type: 'text',
     sizeLimit: 0,
     sizeUnit: 'byte',
     isList: false } ],
     outputTypes: [ { type: 'text', key: 'output' } ],
     parameters: [ { key: 'isAsync', type: 'select', options: [Object], value: null } ] }

     */


    var it = {
        description: null,
        id: 7,
        isActive: true,
        isSynchronous: false,
        name: "Arhiivi lahtipakkija",
        sid: "uzip",
        url: "http://dev.bitweb.ee:3007/api/v1/",

        parentServices: [],
        serviceInputTypes: [
            {
            doParallel: false,
            id: 7,
            isList: false,
            key: "content",
            resourceTypeId: 2,
            sizeLimit: 0,
            sizeUnit: "byte"}
        ],
        serviceOutputTypes: [
            {
                id: 7,
                key: "output",
                resourceTypeId: 2
            }
        ],
        serviceParams: [
            {
            description: null,
            id: 7,
            isEditable: false,
            key: "isAsync",
            paramOptions: [],
            type: "text",
            value: "1"
            }
        ]};


    this._composeServiceDataFromInstallServiceData = function( installData, cb) {

        logger.debug('Compose service data');

        var serviceData = {
            name: installData.name,
            url: installData.url,
            sid: installData.sid,
            description: installData.description,
            serviceParams: [],
            serviceInputTypes: [],
            serviceOutputTypes: [],
            parentServices: [],
            childServices: []
        };

        async.waterfall([
            function mapParams(callback) {

                logger.debug('Compose. Map params');

                for (var i in installData.parameters) {
                    var param = installData.parameters[i];
                    var paramOptions = [];
                    if(param.type == 'select' && param.options){
                        paramOptions = param.options.map(function (item) {
                            return {
                                value: item,
                                label: item
                            }
                        });
                    }
                    serviceData.serviceParams.push({
                        type: param.type,
                        key: param.key,
                        value: param.value,
                        paramOptions: paramOptions
                    });
                }
                callback();
            },
            function mapInputTypes(callback) {

                logger.debug('Compose. Map input types');

                if (installData.inputTypes) {
                    async.eachSeries(installData.inputTypes, function(inputType, innerCallback) {
                        resourceService.getResourceTypeByValue(inputType.type, function(error, resourceType) {
                            if (error) {
                                logger.error( error );
                                return innerCallback(error);
                            }

                            if (!resourceType) {
                                resourceTypeService.createResourceType({
                                    value: inputType.type,
                                    name: inputType.type,
                                    splitType: ResourceType.splitTypes.NONE
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

            function mapOutputTypes(callback) {

                logger.debug('Compose. Map output types');

                if (installData.outputTypes) {
                    async.eachSeries(installData.outputTypes, function(outputType, innerCallback) {
                        resourceService.getResourceTypeByValue(outputType.type, function(error, resourceType) {
                            if (error) {
                                return innerCallback(error);
                            }

                            if (!resourceType) {
                                resourceTypeService.createResourceType({
                                    value: outputType.type,
                                    name: outputType.type,
                                    splitType: ResourceType.splitTypes.NONE
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
                                serviceData.serviceOutputTypes.push({
                                    resourceTypeId: resourceType.id,
                                    key: outputType.key
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
            function mapParentServices(callback) {

                logger.debug('Compose. Map parent services');

                var outputTypes = serviceData.serviceInputTypes.map(function ( item ) {
                    return item.resourceTypeId
                });
                serviceDaoService.findServicesByOutputResourceTypes( outputTypes, function (err, services) {
                    if(err){
                        return callback(err);
                    }

                    serviceData.parentServices = services.map(function (service) {
                        return service.id;
                    });
                    callback();
                });
            },
            function mapChildServices(callback) {

                logger.debug('Compose. Map child services');

                var inputTypes = serviceData.serviceOutputTypes.map(function ( item ) {
                    return item.resourceTypeId;
                });
                serviceDaoService.findServicesByInputResourceTypes( inputTypes, function (err, services) {
                    if(err){
                        return callback(err);
                    }
                    serviceData.childServices = services.map(function (service) {
                        return service.id;
                    });
                    callback();
                });
            }
        ], function(error) {
            if (error) {
                logger.error( error );
                return cb(error);
            }

            logger.debug('Compose. Mapping is done', serviceData);

            return cb(null, serviceData);
        });
    };
}

module.exports = new ServiceService();