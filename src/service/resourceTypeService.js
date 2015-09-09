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
        ResourceType.findAll().then(function (data) {
            callback(null, data);
        }).catch(function (err) {
            callback({
                code: 500,
                message: err.message
            });
        });
    };

    this.getResourceType = function(req, id, callback) {

        ResourceType.find({ where: {id: id }}).then(function(resourceType) {
            if (!resourceType) {
                return callback('No resource type found with id: ' + resourceTypeId);
            }
            return callback(null, resourceType);
        }).catch(function(error) {

            return callback(error);
        });
    };

    this.createResourceType = function(req, resourceTypeData, callback) {
        ResourceType.create(resourceTypeData, {fields: ['name','value', 'splitType']}).then(function(resourceType) {
            return callback(null, resourceType);
        }).catch(function(error) {
            return callback(error);
        });
    };

    this.updateResourceType = function(req, resourceId, data, cb) {
        async.waterfall([
            function (callback) {
                self.getResourceType(req, resourceId, callback);
            },
            function (resourceType, callback) {
                resourceType.updateAttributes(data, {fields: ['name','value', 'splitType']}).then(function () {
                    callback(null, resourceType);
                }).catch(function (err) {
                    callback(err.message);
                });
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