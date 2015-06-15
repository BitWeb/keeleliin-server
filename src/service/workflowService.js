/**
 * Created by taivo on 12.06.15.
 */


var resourceService = require(__base + 'src/service/resourceService');
var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
var GrepWrapper = require(__base + 'src/wrapper/grepWrapper/grepWrapper');

function WorkflowService() {

    var self = this;

    this.getWorkflowsByProjectId = function(req, projectId, callback) {

        return workflowDaoService.findWorkflowsByProjectId(projectId, callback);
    };

    this.getWorkflowServiceParamValues = function(req, workflowServiceId, callback) {

        return workflowDaoService.findWorkflowServiceParamValues(workflowServiceId, callback);
    };

    this.test = function(req, callback) {
        resourceService.getResource(10, function (err, resource) {
            if (err) {
                throw err;
            }

            var grepWrapper = new GrepWrapper();
            grepWrapper.send(resource, function(err, response) {
                if (err) {
                    return callback(err);
                }

                return callback(null, response);
            });
        });
    };
}

module.exports = new WorkflowService();