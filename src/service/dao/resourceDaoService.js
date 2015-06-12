/**
 * Created by taivo on 11.06.15.
 */

var Resource = require(__base + 'src/service/dao/sql').Resource;
var Project = require(__base + 'src/service/dao/sql').Project;

function ResourceDaoService() {

    this.getResource = function(resourceId, callback) {
        Resource.find({where: { id: resourceId }}).then(function(resource) {
            if (!resource) {
                return callback('Resource not found!');
            }
            return callback(null, resource);
        });
    };

    this.getResources = function(pagination, callback) {
        Resource.findAll({
            limit: pagination.limit,
            offset: pagination.offset
        }).then(function(resources) {
            return callback(null, resources);
        });
    };

    this.getProjectResources = function(projectId, callback) {
        Resource.findAll({
            include: [
                {model: Project, where: {
                    id: projectId
                }}
            ],
            logging: console.log
        }).then(function(resources) {
            return callback(null, resources);
        });
    };

}

module.exports = new ResourceDaoService();