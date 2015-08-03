/**
 * Created by taivo on 15.06.15.
 */

var Project = require(__base + 'src/service/dao/sql').Project;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowServiceModel = require(__base + 'src/service/dao/sql').WorkflowService;
var WorkflowServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowServiceParamValue;
var ServiceParam = require(__base + 'src/service/dao/sql').ServiceParam;

function WorkflowDaoService() {

    var self = this;

    this.getWorkflow = function(id, cb){
        Workflow.find({
            where:{id:id}
        }).then(function(item) {
            if(!item){
                return cb('workflow not found');
            }
            return cb(null, item);
        }).catch(cb);
    };

    this.getProjectWorkflowsList = function(projectId, callback) {

        Workflow.findAll({
            attributes: ['id', 'workflowDefinitionId', 'status', 'datetimeStart', 'datetimeEnd'],
            include: [
                {
                    model: Project,
                    as: 'project',
                    where: {id: projectId}
                },
                {
                    model: WorkflowServiceModel,
                    as: 'workflowServices',
                    attributes: ['id', 'serviceId', 'status', 'datetimeStart', 'datetimeEnd', 'orderNum']
                }
            ]
        }).then(function(workflows) {
            return callback(null, workflows);
        });
    };

    this.findWorkflowServiceParamValues = function(workflowServiceId, callback) {
        WorkflowServiceParamValue.findAll({
            attributes: ['id', 'value'],
            include: [
                {
                    model: ServiceParam,
                    as: 'service_param',
                    attributes: ['id', 'type', 'key', 'value', 'orderNum', 'isEditable', 'description']
                }
            ],
            where: {
                workflowServiceId: workflowServiceId
            }
        }).then(function(workflowDefinitionServiceModels) {
            return callback(null, workflowDefinitionServiceModels);
        });
    };

};

module.exports = new WorkflowDaoService();