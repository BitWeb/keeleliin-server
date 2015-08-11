/**
 * Created by priit on 11.08.15.
 */

var logger = require('log4js').getLogger('workflow_server_restart');
var async = require('async');
var Workflow = require(__base + 'src/service/dao/sql').Workflow;

var WorkflowRunner = require('./workflowRunner');

function WorkflowServerRestart(){

    var self = this;

    this.start = function ( cb ) {

        var workflows;

        async.waterfall([
            function getRunningWorkflows(callback) {
                Workflow.findAll({
                    where: {
                        status: Workflow.statusCodes.RUNNING
                    }
                }).then(function (data) {
                    workflows = data;
                    callback();
                }).catch(function (err) {
                    callback( err.message );
                });
            },
            function( callback ){

                if(workflows.length > 0){
                    logger.error('Restarting with ' + workflows.length + ' running workflows');
                } else {
                    logger.trace('No running workflows');
                }
                async.each(workflows, function (workflow, eCb) {
                    self.restartWorkflow(workflow, eCb);
                }, callback );
            }
        ], function (err) {
            if(err){
                logger.error(err)
            }
            cb(err);
        });
    };

    this.restartWorkflow = function ( workflow, cb ) {

        logger.debug('Restart workflow: ' + workflow.id);

        var workflowRunner = new WorkflowRunner();

        async.waterfall([
            function ( callback ) {
                workflowRunner.init(workflow.id, function () {
                    callback();
                });
            },
            function ( callback ) {

                workflow.getFirstWorkflowService(function (err, firstService) {
                    if(err){
                        return logger.error(err);
                    }

                    if( firstService ){
                        logger.debug('Workflow ' + workflow.id + ' order num: ' +  firstService.orderNum );
                        firstService.getNextWorkflowService(function (err, item) {
                            if(item){
                                logger.trace(item.orderNum);
                            }
                        });
                    } else {
                        logger.debug('Workflow has no services: ' + workflow.id);
                    }
                });

                callback();
            },
            function ( callback ) {
                callback();
            },
            function ( callback ) {
                callback();
            }
        ], function (err) {
            cb( err );
        });
    };
}

module.exports = new WorkflowServerRestart();