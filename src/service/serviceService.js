/**
 * Created by taivo on 15.06.15.
 */

var PaginationUtil = require(__base + 'src/util/paginationUtil');
var serviceDaoService = require(__base + 'src/service/dao/serviceDaoService');
var ServiceModel = require(__base + 'src/service/dao/sql').Service;
var ServiceModelParam = require(__base + 'src/service/dao/sql').ServiceParam;
var ServiceOutputType = require(__base + 'src/service/dao/sql').ServiceOutputType;
var ServiceInputType = require(__base + 'src/service/dao/sql').ServiceInputType;
var ArrayUtils = require(__base + 'src/util/arrayUtils');
var async = require('async');
var resourceService = require(__base + 'src/service/resourceService');
var ServiceForm = require(__base + 'src/form/serviceForm');
var sequelize = require(__base + 'src/service/dao/sql').sequelize;

function ServiceService() {

    var self = this;

    this.getService = function(req, serviceId, callback) {

        return serviceDaoService.findService(serviceId, callback);
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

    this.getServiceParamsByIds = function(serviceParamIds, callback) {
        var ids = serviceParamIds || [];

        ServiceModelParam.findAll({where: {id: ids}}).then(function(serviceModelParams) {

            return callback(null, serviceModelParams);
        })
    };

    this.getServicesByIds = function(serviceIds, callback) {
        var ids = serviceIds || [];
        ServiceModel.findAll({ where: { id: ids }}).then(function(services) {

            return callback(null, services);
        });
    };

    this.getServiceOutputTypesByIds = function(serviceOutputTypeIds, callback) {
        var ids = serviceOutputTypeIds || [];

        ServiceOutputType.findAll({where: {id: ids}}).then(function(serviceOutputTypes) {

            return callback(null, serviceOutputTypes);
        });
    };

    this.getServiceModelParam = function(req, serviceModelParamId, callback) {
        ServiceModelParam.find({
            where: {id: serviceModelParamId}
        }).then(function(serviceModelParam) {
            if (!serviceModelParam) {
                return callback('Service model param not found (id: ' + serviceModelParamId + ')');
            }
            return callback(null, serviceModelParam);
        });
    };

    this.getServiceInputType = function(req, serviceInputTypeId, callback) {
        ServiceInputType.find({
            where: {id: serviceInputTypeId}
        }).then(function(serviceInputType) {
            if (!serviceInputType) {
                return callback('Service input type not found (id: ' + serviceInputTypeId + ')');
            }
            return callback(null, serviceInputType);
        });
    };

    this.getServiceOutputType = function(req, serviceOutputTypeId, callback) {
        ServiceOutputType.find({
            where: {id: serviceOutputTypeId}
        }).then(function(serviceOutputType) {
            if (!serviceOutputType) {
                return callback('Service output type not found (id: ' + serviceOutputTypeId + ')');
            }
            return callback(null, serviceOutputType);
        });
    };

    this.getServiceInputTypesByIds = function(serviceInputTypeIds, callback) {
        var ids = serviceInputTypeIds || [];

        ServiceInputType.findAll({where: {id: ids}}).then(function(serviceInputTypes) {

            return callback(null, serviceInputTypes);
        });
    };

    this.getServices = function(req, callback) {
        var pagination = new PaginationUtil();
        if (req.params.offset != undefined) {
            pagination.offset = req.params.offset;
        }
        if (req.params.limit != undefined) {
            pagination.limit = req.params.limit;
        }

        return serviceDaoService.findServices(pagination, callback);
    };

    this.getDependentServices = function(req, serviceId, callback) {
        self.getService(req, serviceId, function(err, service) {
            if (err) {
                return callback(err);
            }

            service.getServiceOutputTypes().then(function(serviceOutputTypes) {
                var resourceTypeIds = [];
                serviceOutputTypes.forEach(function(serviceOutputType) {
                    resourceTypeIds.push(serviceOutputType.resourceTypeId);
                });

                return self._getServicesByInputResourceTypes(req, resourceTypeIds, serviceId, callback);
            });
        });
    };

    this._getServicesByInputResourceTypes = function(req, resourceTypeIds, excludeServiceId, callback) {

        return serviceDaoService.findServicesByInputResourceTypes(resourceTypeIds, excludeServiceId, callback);
    };

    this.createService = function(req, serviceData, cb) {
        var service = null;
        async.waterfall([
            function(callback) {
                ServiceModel.create(serviceData).then(function(serviceModel) {
                    service = serviceModel;
                    return callback(null, serviceModel);
                }).catch(function(error) {
                    return callback(error);
                });
            },

            function(serviceModel, callback) {
                self._addServiceParamValues(req, serviceData, serviceModel, callback);
            },

            function(serviceModel, callback) {
                self._addServiceInputTypes(req, serviceData, serviceModel, callback);
            },

            function(serviceModel, callback) {
                self._addServiceOutputTypes(req, serviceData, serviceModel, callback);
            }
        ], function(error, serviceModel) {
            if (error && service) {

                // Rollback, manually removing incomplete service
                // There exists transaction implementation, but too tedious to use it for creating service
                ServiceModel.destroy({where: {id: service.id}}).then(function() {
                    return cb(error);
                }).catch(function(error) {
                    return cb(error, serviceModel);
                });
            } else {
                return cb(error, serviceModel);
            }


        });
    };

    this.saveService = function(req, serviceId, serviceData, cb) {
        self.getService(req, serviceId, function(err, serviceModel) {
            if (err) {
                return cb(err);
            }

            async.waterfall([
                function(callback) {
                    serviceModel.updateAttributes(serviceData).then(function(serviceModel) {
                        return callback(null, serviceModel);
                    }).catch(function(error) {
                        return callback(error);
                    });
                },

                function(serviceModel, callback) {
                    self._addServiceParamValues(req, serviceData, serviceModel, callback);
                },

                function(serviceModel, callback) {
                    self._addServiceInputTypes(req, serviceData, serviceModel, callback);
                },

                function(serviceModel, callback) {
                    self._addServiceOutputTypes(req, serviceData, serviceModel, callback);
                }
            ], cb);
        });
    };

    this._addServiceParamValues = function(req, serviceData, service, cb) {
        async.waterfall([
            function(callback) {
                var ids = [];
                service.getServiceParams().then(function(serviceParams) {
                    serviceParams.forEach(function(serviceParam) {
                        ids.push(serviceParam.id);
                    });

                    return callback(null, ids);
                });
            },

            function(ids, callback) {
                var addedIds = [],
                    orderNum = 0;

                if (serviceData.serviceParams == undefined) {
                    return callback(null, service, ids, addedIds);
                }

                async.eachSeries(serviceData.serviceParams, function(serviceParam, innerCallback) {
                    self.getServiceModelParam(req, serviceParam.id, function(err, serviceModelParam) {
                        serviceParam.serviceId = service.id;
                        serviceParam.orderNum = orderNum;

                        if (serviceModelParam) {
                            addedIds.push(serviceModelParam.id);
                            serviceModelParam.updateAttributes(serviceParam).then(function(serviceModelParam) {
                                orderNum++;
                                return innerCallback();
                            }).catch(function(err) {
                                return innerCallback(err.message);
                            });
                        } else {
                            serviceModelParam = ServiceModelParam.build(serviceParam);
                            service.addServiceParam(serviceModelParam).then(function(serviceModelParam) {
                                return innerCallback();
                            }).catch(function(err) {
                                return innerCallback(err.message);
                            });
                        }
                    });

                }, function(err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, service, ids, addedIds);
                });
            },

            function removeServiceParams(service, ids, addedIds, callback) {
                var removableIds = ArrayUtils.arrayDiff(ids, addedIds);
                if (removableIds.length > 0) {
                    ServiceModelParam.destroy({where: {id: ids}}).then(function() {
                        return callback(null, service);
                    }).catch(function(error) {

                        return callback(error);
                    });
                } else {
                    return callback(null, service);
                }
            }
        ], cb);
    };

    this._addServiceInputTypes = function(req, serviceData, service, cb) {
        async.waterfall([
            function(callback) {
                var ids = [];
                service.getServiceInputTypes().then(function(serviceInputTypes) {
                    serviceInputTypes.forEach(function(serviceInputType) {
                        ids.push(serviceInputType.id);
                    });
                });

                return callback(null, ids);
            },

            function(ids, callback) {
                var addedIds = [];

                if (serviceData.serviceInputTypes == undefined) {
                    return callback(null, service, ids, addedIds);
                }

                async.eachSeries(serviceData.serviceInputTypes, function(serviceInputTypeData, innerCallback) {

                    self.getServiceInputType(req, serviceInputTypeData.id, function(err, serviceInputType) {
                        serviceInputTypeData.serviceId = service.id;

                        if (serviceInputType) {
                            addedIds.push(serviceInputType.id);
                            serviceInputType.updateAttributes(serviceInputTypeData).then(function(serviceInputType) {
                                return innerCallback();
                            }).catch(function(error) {
                                return innerCallback(error.message);
                            })
                        } else {

                            serviceInputType = ServiceInputType.build(serviceInputTypeData);
                            service.addServiceInputType(serviceInputType).then(function(serviceInputType) {
                                return innerCallback();
                            }).catch(function(error) {
                                return innerCallback(error.message);
                            });
                        }

                    });

                }, function(error) {
                    if (error) {
                        return callback(error);
                    }

                    return callback(null, service, ids, addedIds);
                });
            },

            function(serviceModel, ids, addedIds, callback) {
                var removableIds = ArrayUtils.arrayDiff(ids, addedIds);
                if (removableIds.length > 0) {
                    ServiceInputType.destroy({
                        where: {id: removableIds}
                    }).then(function() {
                        return callback(null, serviceModel);
                    }).catch(function(error) {
                        return callback(error);
                    });
                } else {
                    return callback(null, serviceModel);
                }
            }
        ], cb);
    };

    this._addServiceOutputTypes = function(req, serviceData, service, cb) {
        async.waterfall([
            function(callback) {
                service.getServiceOutputTypes().then(function(serviceOutputTypes) {
                    var ids = [];
                    serviceOutputTypes.forEach(function(serviceOutputType) {
                       ids.push(serviceOutputType.id);
                    });
                    return callback(null, ids);
                });
            },

            function(ids, callback) {
                var addedIds = [];
                if (serviceData.serviceOutputTypes == undefined) {
                    return callback(null, service, ids, addedIds);
                }

                async.eachSeries(serviceData.serviceOutputTypes, function(serviceOutputTypeData, innerCallback) {

                    self.getServiceOutputType(req, serviceOutputTypeData.id, function(err, serviceOutputType) {
                        serviceOutputTypeData.serviceId = service.id;

                        if (serviceOutputType) {
                            addedIds.push(serviceOutputType.id);
                            serviceOutputType.updateAttributes(serviceOutputTypeData).then(function(serviceOutputType) {

                                return innerCallback();
                            }).catch(function(error) {

                                return innerCallback(error);
                            });
                        } else {
                            serviceOutputType = ServiceOutputType.build(serviceOutputTypeData);
                            service.addServiceOutputType(serviceOutputType).then(function() {

                                return innerCallback();
                            }).catch(function(error) {

                                return innerCallback(error);
                            });
                        }
                    });
                }, function(err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, service, ids, addedIds);
                });
            },
            function(serviceModel, ids, addedIds, callback) {
                var removableIds = ArrayUtils.arrayDiff(ids, addedIds);
                if (removableIds.length > 0) {
                    ServiceOutputType.destroy({
                        where: {id: removableIds}
                    }).then(function() {
                        return callback(null, serviceModel);
                    }).catch(function(error) {
                        return callback(error);
                    });
                } else {
                    return callback(null, serviceModel);
                }
            }
        ], cb);
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