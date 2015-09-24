/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('workflow_instance_builder');
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowService = require(__base + 'src/service/dao/sql').WorkflowService;
var WorkflowServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowServiceParamValue;
var async = require('async');

function WorkflowBuilder(){
    var self = this;

    this.create = function (workflowId, cb) {

        async.waterfall([
                function (callback) {
                    Workflow.find({where:{id:workflowId}}).then(function (workflow) {
                        if(!workflow){
                            callback('Töövoogu ei leitud');
                        }
                        callback(null, workflow);
                    });
                },
                function (workflow, callback) {
                    if(workflow.status != Workflow.statusCodes.INIT){
                        return callback('Töövoog ei ole INIT staatusega!');
                    }
                    callback(null, workflow);
                },
                function getWorkflowDefinition(workflow, callback) {
                    workflow.getWorkflowDefinition().then(function (workflowDefinition) {
                        self.setServices(workflow, workflowDefinition, function (err, workflow) {
                            callback(err, workflow, workflowDefinition);
                        })
                    });
                },
                function lockDefinition(workflow, workflowDefinition, callback) {
                    workflowDefinition.updateAttributes({editStatus: WorkflowDefinition.editStatuses.LOCKED}).then(function () {
                        callback(null, workflow);
                    }).catch(function (err) {
                        callback( err.message );
                    });
                }
            ],
            function(err, workflow){
                if(err){
                    logger.error(err);
                    return cb(err);
                }
                cb(null, workflow);
        });
    };

    this.setServices = function (workflow, workflowDefinition, cb) {

        workflowDefinition.getDefinitionServices().then(function (definitionServices) {
            self.copyDefinitionServicesToServices(definitionServices, workflow, cb);
        }).catch(function (err) {
            cb(err.message);
        });
    };

    this.copyDefinitionServicesToServices = function(definitionServices, workflow, cb){

        async.each(definitionServices,
            function (definitionService, callback) {
                self.copyDefinitionService(definitionService, workflow, callback);
            }, function(err){
                if(err){
                    logger.error('Definition services copy failed', err);
                }
                cb( err, workflow);
            }
        );
    };

    this.copyDefinitionService = function (definitionService, workflow, cb) {

        var data = {
            serviceId: definitionService.serviceId,
            serviceParamsValues: definitionService.serviceParamsValues,
            workflowId: workflow.id,
            orderNum: definitionService.orderNum
        };

        WorkflowService.build(data).save().then(function (workflowService) {
            cb(null, workflow);
        }).catch(function (err) {
            cb(err.message);
        });
    };
}

module.exports = new WorkflowBuilder();