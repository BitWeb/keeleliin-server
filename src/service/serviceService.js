/**
 * Created by taivo on 15.06.15.
 */

var PaginationUtil = require(__base + 'src/util/paginationUtil');
var serviceDaoService = require(__base + 'src/service/dao/serviceDaoService');
var ServiceModel = require(__base + 'src/service/dao/sql').Service;
var ServiceModelParam = require(__base + 'src/service/dao/sql').ServiceParam;
var ServiceOutputType = require(__base + 'src/service/dao/sql').ServiceOutputType;
var ServiceInputType = require(__base + 'src/service/dao/sql').ServiceInputType;

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

    this.getServiceOutputTypesByIds = function(serviceOutputTypeIds, callback) {
        var ids = serviceOutputTypeIds || [];

        ServiceOutputType.findAll({where: {id: ids}}).then(function(serviceOutputTypes) {

            return callback(null, serviceOutputTypes);
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

    this.createService = function(req, serviceData, callback) {
        console.log(serviceData);

        var service = ServiceModel.build();
        if (serviceData.name != undefined) {
            service.name = serviceData.name;
        }

        if (serviceData.description != undefined) {
            service.description = serviceData.description;
        }

        if (serviceData.url != undefined) {
            service.url = serviceData.url;
        }

        service.save().then(function(service) {
            var saveService = function() {
                service.save().then(function(serviceModel) {

                    return callback(null, serviceModel);
                }).catch(function(error) {

                    return callback(error);
                });
            };

            var addServiceInputTypes = function() {
                self._addServiceInputTypes(serviceData, service, addServiceOutputTypes);
            };

            var addServiceOutputTypes = function() {
                self._addServiceOutputTypes(serviceData, service, saveService);
            };

            var addServiceParamValues = function() {
                self._addServiceParamValues(serviceData, service, addServiceInputTypes);
            };

            return addServiceParamValues();
        }).catch(function(error) {

            return callback(error);
        });
    };

    this._addServiceParamValues = function(serviceData, service, cb) {

        service.getServiceParams().then(function(serviceParams) {
            var ids = [],
                addedIds = [],
                removeServiceParams = function() {
                    var removableIds = self._arrayDiff(ids, addedIds);

                    return self._removeServiceParams(removableIds, cb);
                },
                addServiceParams = function() {
                    for (var i = 0; i < serviceData.serviceParamKey.length; i++) {
                        var serviceParam = ServiceModelParam.build({
                            key: serviceData.serviceParamKey[i],
                            value: serviceData.serviceParamValue[i],
                            order_num: (i+1)
                        });
                        service.addServiceParam(serviceParam);
                    }

                    return removeServiceParams();
                };

            serviceParams.forEach(function(serviceParam) {
               ids.push(serviceParam.id);
            });

            if (serviceData.serviceParamIds != undefined &&
                serviceData.serviceParamKey != undefined &&
                serviceData.serviceParamValue != undefined) {

                var serviceParamIds = serviceData.serviceParamIds.filter(function(val) {
                    return val !== '';
                });

                if (serviceParamIds.length > 0) {
                    self.getServiceParamsByIds(serviceParamIds, function(error, serviceParams) {
                        if (error) {
                            throw error;
                        }

                        serviceParams.then(function(serviceParams) {
                            serviceParams.forEach(function(serviceParam) {
                                addedIds.push(serviceParam.id);
                            });

                            return addServiceParams();
                        });
                    });
                }
            }

            return addServiceParams();
        });
    };

    this._addServiceInputTypes = function(serviceData, service, cb) {
        service.getServiceInputTypes().then(function(serviceInputTypes) {

            var ids = [],
                addedIds = [],
                removeServiceInputTypes = function() {
                    var removableIds = self._arrayDiff(ids, addedIds);

                    return self._removeServiceInputTypes(removableIds, cb);
                },
                addServiceInputTypes = function() {
                    for (var i = 0; i < serviceData.serviceInputType.length; i++) {
                        if (addedIds.indexOf(serviceData.serviceInputTypeIds[i]) == -1) {
                            var serviceInputType = ServiceInputType.build({
                                type: serviceData.serviceInputType[i]
                            });
                            service.addServiceInputType(serviceInputType);
                        }
                    }

                    return removeServiceInputTypes();
                };

            serviceInputTypes.forEach(function(serviceInputType) {
                ids.push(serviceInputType.id);
            });

            if (serviceData.serviceInputTypeIds != null && serviceData.serviceInputType != undefined) {
                var serviceInputTypeIds = serviceData.serviceInputTypeIds.filter(function(val) {
                    return val !== '';
                });
                if (serviceInputTypeIds.length > 0) {
                    self.getServiceInputTypesByIds(serviceInputTypeIds, function(error, serviceInputTypes) {
                        if (error) {
                            throw error;
                        }

                        serviceInputTypes.then(function(serviceInputTypes) {
                            serviceInputTypes.forEach(function(serviceInputType) {
                                addedIds.push(serviceInputType.id);
                            });
                            return addServiceInputTypes();
                        });

                    });
                }
            }

            return addServiceInputTypes();
        });
    };

    this._addServiceOutputTypes = function(serviceData, service, cb) {
        service.getServiceOutputTypes().then(function(serviceOutputTypes) {
            var ids = [],
                addedIds = [],
                removeServiceOutputTypes = function() {
                    var removableIds = self._arrayDiff(ids, addedIds);

                    return self._removeServiceOutputTypes(removableIds, cb);
                },
                addServiceOutputTypes = function() {
                    for (var i = 0; i < serviceData.serviceOutputType.length; i++) {
                        if (addedIds.indexOf(serviceData.serviceOutputTypeIds[i]) == -1) {
                            var serviceOutputType = ServiceOutputType.build({
                                type: serviceData.serviceOutputType[i]
                            });
                            service.addServiceOutputType(serviceOutputType);
                        }
                    }

                    return removeServiceOutputTypes();
                };

            serviceOutputTypes.forEach(function(serviceOutputType) {
                ids.push(serviceOutputType.id);
            });


            if (serviceData.serviceOutputTypeIds != null && serviceData.serviceOutputType != undefined) {
                var serviceOutputTypeIds = serviceData.serviceOutputTypeIds.filter(function(val) {
                    return val !== '';
                });

                if (serviceOutputTypeIds.length > 0) {
                    self.getServiceOutputTypesByIds(serviceOutputTypeIds, function(error, serviceOutputTypes) {
                        if (error) {
                            throw error;
                        }

                        serviceOutputTypes.then(function(serviceOutputTypes) {
                            serviceOutputTypes.forEach(function(serviceOutputType) {
                                addedIds.push(serviceOutputType.id);
                            });

                            return addServiceOutputTypes();
                        });
                    });
                }

            }

            return addServiceOutputTypes();
        });
    };

    this._removeServiceParams = function(serviceParamIds, cb) {
        var ids = serviceParamIds || [];
        if (ids.length > 0) {
            ServiceModelParam.destroy({where: {id: ids}}).then(function() {

                return cb();
            });
        }
        return cb();
    };

    this._removeServiceInputTypes = function(inputTypeIds, cb) {
        var ids = inputTypeIds || [];
        if (ids.length > 0) {
            ServiceInputType.destroy({where: {id: ids}}).then(function() {

                return cb();
            });
        }
        return cb();
    };

    this._removeServiceOutputTypes = function(outputTypeIds, cb) {
        var ids = outputTypeIds || [];
        if (ids.length > 0) {
            ServiceOutputType.destroy({where: {id: ids}}).then(function() {

                return cb();
            });
        }
        return cb();
    };

    this._arrayDiff = function(array1, array2) {
        var result = [];
        for (var i = 0; i < array1.length; i++) {
            if (array2.indexOf(array1[i]) == -1) {
                result.push(array1[i]);
            }
        }
        return result;
    };

}

module.exports = new ServiceService();