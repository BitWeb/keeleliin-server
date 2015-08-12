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
                    workflow.log = 'Server taaskäivitati';
                    workflow.status = Workflow.statusCodes.ERROR;
                    workflow.save().then(function () {
                        eCb();
                    });
                }, callback );
            }
        ], function (err) {
            if(err){
                logger.error(err)
            }
            cb(err);
        });
    };
}

module.exports = new WorkflowServerRestart();