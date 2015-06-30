/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('workflow_runner');
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var InstanceBuilder = require('./instanceBuilder');
var async = require('async');


function Runner(){
    var self = this;

    //Käivita töövoo definitsioon
    this.init = function (workflowDefinitionId, cb) {
        //todo
    };

    this.initWithResource = function (workflowDefinitionId, resourceId, cb) {

        //var inInstanceBuilder



        self.getWorkflowDefinition(workflowDefinitionId, function (err) {
            
        });
        
        

        

        // create workflow
        // create workflow services with params
        // run services
            //get and split resources

    };







}

module.exports = Runner;