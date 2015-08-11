var scheduler = require('node-schedule');
var workflowService = require(__base + 'src/service/workflowService');
var notificationService = require(__base + 'src/service/notificationService');
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;
var async = require('async');
var logger = require('log4js').getLogger('workflow_checker');

var WorkflowChecker = function() {
    var self = this;

    this.init = function() {
        scheduler.scheduleJob('0 0 * * *', function(){
            self.checkRunningWorkflows();
        });
        self.checkRunningWorkflows();
    };

    this.checkRunningWorkflows = function() {
        logger.debug('Running workflow checker');

        async.waterfall([
            function(callback) {
                notificationService.getNotificationTypeByCode(NotificationType.codes.WORKFLOW_STILL_RUNNING, function(error, notificationType) {
                    if (error) {
                        return callback(error);
                    }
                    return callback(null, notificationType);
                });
            },
            function(notificationType, callback) {
                workflowService.getWorkflowsRunning(function(error, workflows) {
                    if (error) {
                        return callback(error);
                    }

                    if (workflows) {
                        async.eachSeries(workflows, function(workflow, innerCallback) {
                            logger.debug('Workflow (id: ' + workflow.id + ') is running, date started: ' + workflow.datetimeStart);
                            var now = new Date();
                            now.setDate(now.getDate() - notificationType.notifyPeriodDays);
                            console.log(now);
                            if (now > workflow.datetimeStart) {
                                logger.debug('Workflow (id: ' + workflow.id + ') is still running, over ' + notificationType.notifyPeriodDays + ' days.');
                                workflow.getWorkflowDefinition().then(function(workflowDefinition) {
                                    notificationService.addNotification(workflowDefinition.userId, NotificationType.codes.WORKFLOW_STILL_RUNNING, workflow.id, function(error, notification) {
                                        if (error) {
                                            logger.error('Adding notification error: ' + error);
                                        }
                                    });
                                }).catch(function(error) {
                                    logger.error('Adding notification error: ' + error.message);

                                });
                            }
                            innerCallback();
                        }, function(error) {
                            if (error) {
                                return callback(error);
                            }
                            return callback();
                        });
                    } else {
                        return callback();
                    }

                });
            }
        ], function(error, result) {
            if (error) {
                logger.error('Workflow checker error: ' + error);
            }
        });

    }
};

module.exports = new WorkflowChecker();