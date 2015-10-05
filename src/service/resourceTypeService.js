/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('resource_service');
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;
var async = require('async');
var config = require(__base + 'config');

function ResourceTypeService() {

    var self = this;

    this.getResourceTypesList = function (req, callback) {
        ResourceType.findAll({
            order: [['name','ASC']]
        }).then(function (data) {
            callback(null, data);
        }).catch(function (err) {
            callback({
                code: 500,
                message: err.message
            });
        });
    };

    this.getResourceType = function(req, id, callback) {

        ResourceType.findById( id ).then(function(resourceType) {
            if (!resourceType) {
                return callback('No resource type found with id: ' + resourceTypeId);
            }
            return callback(null, resourceType);
        }).catch(function(error) {
            return callback(error);
        });
    };

    this.getResourceTypeOverview = function(req, id, cb) {

        var overview;

        async.waterfall([
                function ( callback ) {
                    self.getResourceType(req, id, callback);
                },
                function ( resourceType, callback ) {
                    overview = resourceType.dataValues;
                    resourceType.getInputTypes().then(function (inputTypes) {
                        async.map(inputTypes, function (inputType, innerCb) {
                            inputType.getService().then(function (service) {
                                var serviceData = {
                                    id: service.id,
                                    name: service.name
                                };
                                innerCb( null, serviceData);
                            });
                        }, function (err, inputMap) {
                            overview.useAsInput = inputMap;
                            callback(err, resourceType);
                        });
                    });
                },
                function ( resourceType, callback ) {
                    resourceType.getOutputTypes().then(function (outputTypes) {
                        async.map(outputTypes, function (outputType, innerCb) {
                            outputType.getService().then(function (service) {
                                var serviceData = {
                                    id: service.id,
                                    name: service.name
                                };
                                innerCb( null, serviceData);
                            });
                        }, function (err, outputMap) {
                            overview.useAsOutput = outputMap;
                            callback(err, resourceType);
                        });
                    });
                }
            ],
            function (err) {
                cb(err, overview);
            }
        );
    };

    this.addResourceType = function(req, resourceTypeData, callback) {
        self.createResourceType(resourceTypeData, function (err, resourceType) {
            self.getResourceTypeOverview(req, resourceType.id, callback);
        });
    };

    this.createResourceType = function(resourceTypeData, callback) {
        ResourceType.create(resourceTypeData, {fields: ['name','value', 'splitType']}).then(function(resourceType) {
            return callback(null, resourceType);
        }).catch(function(error) {
            return callback(error);
        });
    };

    this.updateResourceType = function(req, typeId, data, cb) {
        async.waterfall([
            function (callback) {
                self.getResourceType(req, typeId, callback);
            },
            function (resourceType, callback) {
                resourceType.updateAttributes(data, {fields: ['name','value', 'splitType']}).then(function () {
                    callback(null, resourceType);
                }).catch(function (err) {
                    callback(err.message);
                });
            },
            function (resourceType, callback) {
                self.getResourceTypeOverview(req, typeId, callback);
            }
        ], cb);
    };

    this.deleteResourceType = function (req, id, callback) {

        async.waterfall(
            [
                function getResourceType(callback) {
                    self.getResourceType(id, callback);
                },
                function deleteResourceType(resourceType, callback) {
                    resourceType.destroy().then(function () {
                        callback()
                    }).catch(function (err) {
                        return callback( err.message );
                    });
                }
            ],
            function (err) {
                callback( err );
            }
        );
    }
}

module.exports = new ResourceTypeService();