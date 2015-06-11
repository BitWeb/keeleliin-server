/**
 * Created by taivo on 11.06.15.
 */

var resourceDaoService = require('./dao/resourceDaoService');

function ResourceService() {

    this.getProjectResources = function(req, projectId, callback) {

        return resourceDaoService.getProjectResources(projectId, callback);
    };

    this.getResources = function(req, callback) {
        var pagination = {
            total: (req.params.total ? req.params.total : 100),
            offset: (req.params.offset ? req.params.offset : 0)
        };

        return resourceDaoService.getResources(pagination, callback);
    };

}

module.exports = new ResourceService();