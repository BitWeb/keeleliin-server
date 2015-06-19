/**
 * Created by taivo on 15.06.15.
 */

var ServiceModel = require(__base + 'src/service/dao/sql').ServiceModel;
var ServiceModelParam = require(__base + 'src/service/dao/sql').ServiceModelParam;

function ServiceDaoService() {

    this.findService = function(serviceId, callback) {
        ServiceModel.find({
            where: {id: serviceId},
            include: [
                {
                    model: ServiceModelParam,
                    as: 'service_params',
                    order: ['order_num', 'ASC']
                }
            ]
        }).then(function(service) {
           return callback(null, service);
        });
    };

    this.findServices = function(pagination, callback) {
        ServiceModel.findAll({
            include: [
                {
                    model: ServiceModelParam,
                    as: 'service_params',
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