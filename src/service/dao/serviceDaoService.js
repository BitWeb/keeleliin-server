/**
 * Created by taivo on 15.06.15.
 */
var logger = require('log4js').getLogger('service_dao_service');
var ServiceModel = require(__base + 'src/service/dao/sql').Service;
var ServiceModelParam = require(__base + 'src/service/dao/sql').ServiceParam;
var ParamOption = require(__base + 'src/service/dao/sql').ParamOption;
var ServiceInputType = require(__base + 'src/service/dao/sql').ServiceInputType;
var ServiceOutputType = require(__base + 'src/service/dao/sql').ServiceOutputType;

function ServiceDaoService() {

    this.findService = function(serviceId, callback) {
        ServiceModel.find({
            where: {id: serviceId}
        }).then(function(service) {
            if (!service) {
                return callback('Service not found.');
            }
            return callback(null, service);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.getServiceEditData = function (serviceId, callback) {
        ServiceModel.find({
            where: { id: serviceId },
            attributes: [
                'id',
                'name',
                'description',
                'url',
                'sid',
                'isSynchronous',
                'isActive'
            ],
            include: [
                {
                    model: ServiceModelParam,
                    as: 'serviceParams',
                    attributes: ['id','type', 'key', 'value', 'isEditable', 'description'],
                    required: false,
                    include: [{
                        model: ParamOption,
                        as : 'paramOptions',
                        attributes: ['id', 'value', 'label'],
                        required:false
                    }]
                },
                {
                    model: ServiceInputType,
                    as: 'serviceInputTypes',
                    attributes: ['id', 'key', 'doParallel', 'sizeLimit', 'sizeUnit', 'isList', 'resourceTypeId'],
                    required: false
                },
                {
                    model: ServiceOutputType,
                    as: 'serviceOutputTypes',
                    attributes: ['id', 'key', 'resourceTypeId'],
                    required: false
                },
                {
                    model: ServiceModel,
                    as: 'parentServices',
                    attributes: [ 'id' ],
                    where: {isActive: true},
                    required: false
                },
                {
                    model: ServiceModel,
                    as: 'childServices',
                    attributes: [ 'id' ],
                    where: {isActive: true},
                    required: false
                }
            ]
        }).then(function(service) {
            if (!service) {
                return callback('Service not found.');
            }
            return callback(null, service);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.getServicesList = function( callback ) {

        var params = {
            attributes: ['id', 'name', 'description', 'sid', 'createdAt', 'updatedAt', 'isActive'],
            order: [['name', 'ASC']]
        };

        ServiceModel.findAll(params)
            .then(function(services) {
            return callback(null, services);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.getServicesDetailedList = function( callback ) {

        var params = {
            attributes: [
                'id',
                'name',
                'description',
                'isSynchronous',
                'isActive'
            ],
            include: [
                {
                    model: ServiceModelParam,
                    as: 'serviceParams',
                    attributes: ['id','type','key','value','isEditable','description'],
                    required: false,
                    include: [{
                        model: ParamOption,
                        as: 'paramOptions',
                        attributes: ['id','value','label'],
                        required: false
                    }]
                },
                {
                    model: ServiceModel,
                    as: 'childServices',
                    attributes: ['id'],
                    where: {isActive: true},
                    required: false
                },
                {
                    model: ServiceModel,
                    as: 'parentServices',
                    attributes: ['id'],
                    where: {isActive: true},
                    required: false
                },
                {
                    model: ServiceInputType,
                    as: 'serviceInputTypes',
                    attributes: ['id','resourceTypeId','key'],
                    required: false
                },
                {
                    model: ServiceOutputType,
                    as: 'serviceOutputTypes',
                    attributes: ['id','resourceTypeId','key'],
                    required: false
                }
            ],
            order: [
                ['name', 'ASC']
            ]
        };

        ServiceModel.findAll(params)
            .then(function(services) {
                return callback(null, services);
            }).catch(function(error) {
                return callback({
                    message: error.message,
                    code: 500
                });
            });
    };

    this.findServicesByInputResourceTypes = function(resourceTypeIds, callback) {
        ServiceModel.findAll({
            attributes: [
                'id'
            ],
            where: {isActive: true},
            include: [
                {
                    model: ServiceInputType,
                    as: 'serviceInputTypes',
                    where: {
                        resourceTypeId: resourceTypeIds
                    },
                    required: true
                }
            ]
        }).then(function(services) {
            return callback(null, services)
        }).catch(function(error) {
            return callback( error.message );
        });
    };

    this.findServicesByOutputResourceTypes = function(resourceTypeIds, callback) {
        ServiceModel.findAll({
            attributes: [
                'id'
            ],
            where: {isActive: true},
            include: [
                {
                    model: ServiceOutputType,
                    as: 'serviceOutputTypes',
                    where: {
                        resourceTypeId: resourceTypeIds
                    },
                    required: true
                }
            ]
        }).then(function(services) {
            return callback(null, services)
        }).catch(function(error) {
            return callback( error.message );
        });
    };

}

module.exports = new ServiceDaoService();