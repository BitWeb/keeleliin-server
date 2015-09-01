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