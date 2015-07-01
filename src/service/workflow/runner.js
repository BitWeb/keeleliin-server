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

        logger.debug('Run workflow id: '  + workflowId);

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
            function (callback) {
                self.checkStatusForRun(callback);
            },
            function (callback) {
                self.startWorkflow(callback);
            }
        ], function (err) {
            if(err){
                logger.error(err);
                return cb(err);
            }
            return cb(null, workflow);
        });
    };

    self.getWorkflow = function (id, cb) {
        workflowDaoService.getWorkflow(id, function(err, item){
            if(err){
                return cb(err);
            }
            workflow = item;
            cb();
        });
    };

    self.checkStatusForRun = function(cb){
        if(workflow.status != Workflow.statusCodes.INIT){
            return cb('Antud töövoo ühik on juba varem käivitatud');
        }
        return cb()
    };

    self.startWorkflow = function (cb) {

        workflow.status = Workflow.statusCodes.RUNNING;
        workflow.datetime_start = new Date();

        workflow.save().then(function (updatedWorkflow) {
            workflow = updatedWorkflow;

            cb(null, workflow); // return to user

            self.startHandleServices();
        }).catch(function (err) {
            cb(err);
        });
    };

    var services;

    self.startHandleServices = function(){
        logger.error('handleServices');

        workflow.getWorkflowServices().then(function (data) {
            services = data;

            logger.error(services);
        }).catch(function (err) {
            self.finishWorkflow( Workflow.statusCodes.ERROR, function (err, item) {});
        });
    };






//************
    self.finishWorkflow = function (status, cb) {
        workflow.status = status;
        workflow.datetime_end = new Date();
        workflow.save().then(function (updatedWorkflow) {
            workflow = updatedWorkflow;
            logger.info('Workflow id:'+updatedWorkflow.id+' finished with status: ' + workflow.status);
            cb(null, workflow);
        }).catch(function (err) {
            cb(err);
        });
    }
}

module.exports = Runner;