/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('workflow_runner');
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var async = require('async');

function Runner(){
    var self = this;

    //Käivita töövoo
    this.init = function (workflowId, cb) {
        //todo

        //1 get workflow
        //2 check workflow status
        //3 get next workflow_service or go 8
        //4 check workflow_service status //error or running go 9
        //5 get workflow_service input_resources | substep back or index
        //6 check if resource is handled from service
        //7 handle resource
        //8 go 3
        //9 finish





    };









}

module.exports = Runner;