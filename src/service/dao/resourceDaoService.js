/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('resource_dao_service');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var Project = require(__base + 'src/service/dao/sql').Project;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var WorkflowService = require(__base + 'src/service/dao/sql').WorkflowService;

function ResourceDaoService() {

    this.getResources = function(query, callback) {

        //todo: query.projectId AND query.workflowId

        Resource.findAll({
            attributes: [
                'id',
                'name',
                'createdAt'
            ]
        }).then(function(resources) {
            return callback(null, resources);
        });
    };

    this.getResource = function(resourceId, callback) {

        Resource.find({ where: {id: resourceId }}).then(function(resource) {
            if(!resource){
                return callback('Resource not found');
            }
            return callback(null, resource);
        }).catch(function(error) {
            logger.error(error);
            return callback(error);
        });
    };

}

module.exports = new ResourceDaoService();