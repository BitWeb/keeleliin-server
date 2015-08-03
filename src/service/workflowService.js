/**
 * Created by taivo on 12.06.15.
 */

var logger = require('log4js').getLogger('workflow_service');
var resourceService = require(__base + 'src/service/resourceService');
var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
var workflowDefinitionService = require(__base + 'src/service/workflowDefinitionService');
var Workflow = require(__base + 'src/service/dao/sql').Workflow;

function WorkflowService() {

    var self = this;

    this.getWorkflow = function(req, workflowId, callback) {

        Workflow.find({ where: {id: workflowId }}).then(function(workflow) {

            return callback(null, workflow);
        }).catch(function(error) {

            return callback(error);
        });
    };

    this.getWorkflowServiceParamValues = function(req, workflowServiceId, callback) {
        return workflowDaoService.findWorkflowServiceParamValues(workflowServiceId, callback);
    };

    this.getProjectWorkflowsList = function(req, projectId, callback) {
        logger.debug('Get project workflows list');
        return workflowDaoService.getProjectWorkflowsList(projectId, function (err, workflows) {
            var dto = [];
            for(i in workflows){
                var item = workflows[i];

                var dtoItem = {
                    id: item.id,
                    name: item.name,
                    status: item.status,
                    datetimeCreated: item.datetimeCreated,
                    datetimeStart: item.datetimeStart,
                    datetimeEnd: item.datetimeEnd,
                    progress: (item.workflowServices.filter(function(value){return value.status == 'FINISHED';}).length * 100) / item.workflowServices.length
                };
                dto.push(dtoItem);
            }
            callback(err, dto);
        });
    };


}

module.exports = new WorkflowService();