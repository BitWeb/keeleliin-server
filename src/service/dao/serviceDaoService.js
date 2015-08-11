/**
 * Created by taivo on 15.06.15.
 */
var logger = require('log4js').getLogger('service_dao_service');
var ServiceModel = require(__base + 'src/service/dao/sql').Service;
var ServiceModelParam = require(__base + 'src/service/dao/sql').ServiceParam;
var ServiceInputType = require(__base + 'src/service/dao/sql').ServiceInputType;
var ServiceOutputType = require(__base + 'src/service/dao/sql').ServiceOutputType;

function ServiceDaoService() {

    this.findService = function(serviceId, callback) {
        ServiceModel.find({
            where: {id: serviceId},
            include: [
                {
                    model: ServiceModelParam,
                    as: 'serviceParams',
                    order: ['order_num', 'ASC']
                },
                {
                    model: ServiceInputType,
                    as: 'serviceInputTypes'
                },
                {
                    model: ServiceOutputType,
                    as: 'serviceOutputTypes'
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

    this.findServices = function(pagination, callback) {

        ServiceModel.findAll({
            include: [
                {
                    model: ServiceModelParam,
                    as: 'serviceParams',
                    order: ['orderNum', 'ASC']
                },
                {
                    model: ServiceInputType,
                    as: 'serviceInputTypes'
                },
                {
                    model: ServiceOutputType,
                    as: 'serviceOutputTypes'
                }
            ],
            limit: pagination.limit,
            offset: pagination.offset
        }).then(function(services) {
            return callback(null, services);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.findServicesByInputResourceTypes = function(resourceTypeIds, excludeServiceId, callback) {
        ServiceModel.findAll({
            include: [
                {
                    model: ServiceModelParam,
                    as: 'serviceParams',
                    order: [['orderNum', 'ASC']]
                },
                {
                    model: ServiceInputType,
                    as: 'serviceInputTypes',
                    where: {
                        resourceTypeId: resourceTypeIds
                    }
                }
            ],
            where: {
                id: { $ne: excludeServiceId }
            }
        }).then(function(services) {
            return callback(null, services)
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    }

}

module.exports = new ServiceDaoService();