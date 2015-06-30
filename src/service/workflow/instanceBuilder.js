/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('workflow_runner');

var projectDaoService = require(__base + 'src/service/dao/projectDaoService');

var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;

var async = require('async');


function InstanceBuilder(){
    var self = this;

    this.createWorkflow = function (projectId, workflowDefinitionId, resourceId, cb) {

        projectDaoService.getProject(projectId, function(){

        });


        self.getWorkflowDefinition(workflowDefinitionId, function (err, definition) {
            if(err) return cb(err);

            var workflowData = {
                project_id: definition.project_id,
                workflow_definition_id: definition.id,
                input_resource_id: resourceId
            };

            Workflow.build(workflowData).save().then(function (workflow) {

                cb(workflow);
            }).catch(function(error) {
                logger.error(error);
                return cb(error);
            });


        });

        // create workflow
        // create workflow services with params
        // run services
        //get and split resources

    };

    this.getProject = function () {

    };

    this.getWorkflowDefinition = function (id, cb) {
        WorkflowDefinition.find({ where: { id: id }}).then(function(workflowDefinition) {
            if(!workflowDefinition){
                return cb('Töövoo definitsiooni ei leitud');
            }
            return cb(null, workflowDefinition);
        }).catch(function(error) {
            return cb(error);
        });
    }






}

module.exports = InstanceBuilder;