/**
 * Created by taivo on 15.06.15.
 */

var ServiceModel = require(__base + 'src/service/dao/sql').Service;
var ServiceModelParam = require(__base + 'src/service/dao/sql').ServiceParam;

function ServiceDaoService() {

    this.findService = function(serviceId, callback) {
        ServiceModel.find({
            where: {id: serviceId},
            include: [
                {
                    model: ServiceModelParam,
                    as: 'serviceParams',
                    order: ['order_num', 'ASC']
                }
            ]
        }).then(function(service) {
            if (!service) {
                return callback('Service not found.');
            }
            return callback(null, service);
        });
    };

    this.findServices = function(pagination, callback) {
        ServiceModel.findAll({
            include: [
                {
                    model: ServiceModelParam,
                    as: 'serviceParams',
                    order: ['order_num', 'ASC']
                }
            ],
            limit: pagination.limit,
            offset: pagination.offset
        }).then(function(services) {
            return callback(null, services);
        });
    };
}

module.exports = new ServiceDaoService();