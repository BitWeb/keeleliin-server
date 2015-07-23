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

function ServiceService() {

    var self = this;

    this.getService = function(req, serviceId, callback) {

        return serviceDaoService.findService(serviceId, callback);
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
                    resourceTypeIds.push(serviceOutputType.resource_type_id);
                });

                return self._getServicesByInputResourceTypes(req, resourceTypeIds, serviceId, callback);
            });
        });
    };

    this._getServicesByInputResourceTypes = function(req, resourceTypeIds, excludeServiceId, callback) {

        return serviceDaoService.findServicesByInputResourceTypes(resourceTypeIds, excludeServiceId, callback);
    };

    this.createService = function(req, serviceData, cb) {
        async.waterfall([
            function(callback) {
                ServiceModel.create(serviceData).then(function(serviceModel) {

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
        ], function(err, serviceModel) {
            if (err) {
                return cb(err);
            }

            return cb(null, serviceModel);
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

                if (serviceData.serviceParam == undefined) {
                    return callback(null, service, ids, addedIds);
                }

                async.eachSeries(serviceData.serviceParam, function(serviceParam, innerCallback) {
                    self.getServiceModelParam(req, serviceParam.id, function(err, serviceModelParam) {
                        var serviceParamData = {
                            key: serviceParam.key,
                            value: serviceParam.value,
                            order: orderNum
                        };

                        if (serviceModelParam) {
                            addedIds.push(serviceModelParam.id);
                            serviceModelParam.updateAttributes(serviceParamData).then(function(serviceModelParam) {
                                orderNum++;
                                return innerCallback();
                            }).catch(function(err) {
                                return innerCallback(err);
                            });
                        } else {
                            ServiceModelParam.create(serviceParamData).then(function(serviceModelParam) {
                                service.addServiceParam(serviceModelParam).then(function() {
                                    return innerCallback();
                                }).catch(function(err) {
                                    return innerCallback(err);
                                });

                            }).catch(function(err) {
                                return innerCallback(err);
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
                }
                return callback(null, service);
            }
        ], function(err, serviceModel) {
            if (err) {
                return cb(err);
            }
            return cb(null, serviceModel);
        });
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

                if (serviceData.serviceInputType == undefined) {
                    return callback(null, service, ids, addedIds);
                }

                async.eachSeries(serviceData.serviceInputType, function(serviceInputTypeData, innerCallback) {

                    self.getServiceInputType(req, serviceInputTypeData.id, function(err, serviceInputType) {
                        var data = {
                            key: serviceInputTypeData.key,
                            do_parallel: serviceInputTypeData.do_parallel,
                            size_limit: serviceInputTypeData.size_limit,
                            size_unit: serviceInputTypeData.size_unit,
                            resource_type_id: serviceInputTypeData.resource_type_id
                        };

                        if (serviceInputType) {
                            addedIds.push(serviceInputType.id);
                            serviceInputType.updateAttributes(data).then(function(serviceInputType) {
                                return innerCallback();
                            }).catch(function(error) {
                                return innerCallback(error);
                            })
                        } else {
                            ServiceInputType.create(data).then(function(serviceInputType) {
                                service.addServiceInputType(serviceInputType).then(function() {
                                    return innerCallback();
                                }).catch(function(error) {
                                    return innerCallback(error);
                                });
                            }).catch(function(error) {
                                return innerCallback(error);
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
                }
                return callback(null, serviceModel);
            }
        ], function(err, serviceModel) {
            if (err) {
                return cb(err);
            }
            return cb(null, serviceModel);
        });
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
                if (serviceData.serviceOutputType == undefined) {
                    return callback(null, service, ids, addedIds);
                }

                async.eachSeries(serviceData.serviceOutputType, function(serviceOutputTypeData, innerCallback) {

                    self.getServiceOutputType(req, serviceOutputTypeData.id, function(err, serviceOutputType) {
                        var data = {
                            key: serviceOutputTypeData.key,
                            resource_type_id: serviceOutputTypeData.resource_type_id
                        };

                        if (serviceOutputType) {
                            serviceOutputType.updateAttributes(data).then(function(serviceOutputType) {

                                return innerCallback();
                            }).catch(function(error) {

                                return innerCallback(error);
                            });
                        } else {
                            ServiceOutputType.create(data).then(function(serviceOutputType) {
                                service.addServiceOutputType(serviceOutputType).then(function() {

                                    return innerCallback();
                                }).catch(function(error) {

                                    return innerCallback(error);
                                });
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
                }
                return callback(null, serviceModel);
            }
        ], function(err, serviceModel) {
            if (err) {
                return cb(err);
            }
            return cb(null, serviceModel);
        });
    };
}

module.exports = new ServiceService();