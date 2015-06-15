/**
 * Created by taivo on 15.06.15.
 */

var PaginationUtil = require(__base + 'src/util/paginationUtil');
var serviceDaoService = require(__base + 'src/service/dao/serviceDaoService');

function ServiceService() {

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

}

module.exports = new ServiceService();