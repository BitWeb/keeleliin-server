/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('workflow_runner');

var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');

var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var async = require('async');

function Runner(){
    var self = this;

    var workflow;

    //Käivita töövoo
    this.run = function (workflowId, cb) {
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

        async.waterfall([
            function (callback) {
                self.getWorkflow(workflowId, callback);
            },
            self.checkStatusForRun(),
            self.startWorkflow()
        ], function (err) {
            if(err) return cb(err);
            cb( workflow );
        });
    };

    this.getWorkflow = function (id, cb) {
        workflowDaoService.getWorkflow(workflowId, function(err, item){
            if(err) return callback(err);
            workflow = item;
            callback();
        });
    };

    this.checkStatusForRun = function(cb){
        if(workflow.status != Workflow.statusCodes.INIT){
            return cb('Antud töövoo ühik on juba varem käivitatud');
        }
        return cb()
    };

    this.startWorkflow = function (cb) {

        workflow.status = Workflow.statusCodes.RUNNING;
        workflow.datetime_start = new Date();

        workflow.save().then(function (updatedWorkflow) {
            workflow = updatedWorkflow;
            cb(null, workflow);

            self.handleServices();
        }).catch(function (err) {
            cb(err);
        });
    };

    this.handleServices = function(){
        logger.error('handleServices');



    };







}

module.exports = Runner;