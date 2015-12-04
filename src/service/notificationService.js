var notificationDaoService = require('./dao/notificationDaoService');
var Notification = require(__base + 'src/service/dao/sql').Notification;
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var User = require(__base + 'src/service/dao/sql').User;
var Project = require(__base + 'src/service/dao/sql').Project;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var async = require('async');
var mailService = require(__base + 'src/service/mailService');
var logger = require('log4js').getLogger('notification_service');
var config = require(__base + 'config');
var fs = require('fs');
var ObjectUtils = require('../util/objectUtils');

function NotificationService() {

    var self = this;

    this.getCurrentUserNotificationsSummary = function (req, cb) {

        var userId = req.redisSession.data.userId;

        async.waterfall(
            [
                function ( callback ) {
                    notificationDaoService.getNotificationsUnreadCountByUser(userId, function (err, count) {
                        var summary = {
                            total: count
                        };
                        callback(err, summary);
                    });
                },
                function ( summary, callback ) {
                    notificationDaoService.getLastNotificationsUnreadByUser( userId, function (err, data) {
                        summary.notifications = data;
                        callback(err, summary);
                    });
                }
            ],
            function (err, summary ) {
                if(err){
                   logger.error(err);
                }
                cb( err, summary );
            }
        );
    };

    this.getNotificationsList = function (req, params, cb) {
        var userId = req.redisSession.data.userId;
        notificationDaoService.getUserNotificationsList( userId, params, function (err, data) {
            if(err){
                logger.error(err);
            }
            cb(err, data);
        });
    };


    this.getNotification = function(req, notificationId, callback) {

        Notification.findById( notificationId ).then(function(notification) {
            if (!notification) {
                return callback('Notification not found.')
            }
            return callback(null, notification);
        }).catch(function(error) {
            logger.error('Get notification error', error);
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.getNotificationTypeByCode = function(code, callback) {
        NotificationType.find({where: {code: code}}).then(function(notificationType) {
            if (!notificationType) {
                return callback('Notification type with code "' + code + '" not found.')
            }
            return callback(null, notificationType);
        }).catch(function(error) {
            logger.error('Get notification by type error', error);
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.readNotification = function(req, notificationId, callback) {

        self.getNotification(req, notificationId, function(error, notification) {
            if (error) {
                return callback(error);
            }

            if (notification.isRead) {
                var response = ObjectUtils.mapProperties(notification, ['id','message','url','isRead','cratedAt']);
                return callback(null, response);
            }

            notification.isRead = true;
            notification.dateRead = new Date();
            notification.save().then(function () {
                var response = ObjectUtils.mapProperties(notification, ['id','message','url','isRead','cratedAt']);
                return callback(null, response);
            });
        });
    };

    this.readAllNotifications = function (req, callback) {

        Notification.update(
            {
            isRead: true,
            dateRead: new Date()
            },
            { where: {
                    toUserId: req.redisSession.data.userId
                }
            }
        ).then(function () {
            return callback(null);
        }).catch(function(error) {
            return callback( error.message )
        });
    };

    this.deleteNotification = function (req, notificationId, callback) {
        self.getNotification(req, notificationId, function(error, notification) {
            if (error) {
                return callback(error);
            }
            notification.destroy().then(function () {
                return callback(null);
            }).catch(function(error) {
                return callback( error.message )
            });
        });
    };



    this.addNotification = function(userId, code, modelId, cb) {
        logger.debug('Add notification. user: ' + userId + ' code: ' + code + ' modelId: ' + modelId);
        notificationDaoService.getNotificationByUserAndCodeAndModel(userId, code, modelId, function(error, notification) {
            if (error) {
                logger.error('Add notification error: ', error);
                return cb(error);
            }

            // Already added
            if (notification) {
                logger.debug('Notification (id: ' + notification.id + ') already added.');
                return cb(null, notification);
            }

            async.waterfall([
                function getNotificationType(callback) {
                    self.getNotificationTypeByCode(code, function(error, notificationType) {
                        return callback(error, notificationType);
                    });
                },
                function createNotification(notificationType, callback ) {

                    var initData = {
                        notificationTypeId: notificationType.id,
                        toUserId: userId,
                        modelId: modelId,
                        url: notificationType.urlTemplate,
                        message: notificationType.messageTemplate,
                        mailSubject: notificationType.mailSubjectTemplate,
                        mailBody: fs.readFileSync( __dirname + '/../../views/email_templates/' + notificationType.code + '.html').toString()
                    };

                    Notification.create(initData).then(function( notification ) {
                        self._updateNotificationTextValues(notificationType, notification, function (err, notification) {
                            if(err){
                                return callback(err);
                            }
                            notification.save().then(function () {
                                return callback(null, notification, notificationType);
                            }).catch(function(error) {
                                logger.error('Create error', error);
                                return callback( error.message )
                            });
                        });
                    }).catch(function(error) {
                        logger.error('Create error', error);
                        return callback( error.message )
                    });
                },
                function sendEmail(notification, notificationType, callback) {

                    if (notificationType.isSendEmail) {
                        return self._sendNotificationEmail(notification, notificationType, callback);
                    }
                    return callback(null, notification);
                }
            ], function(error, notification) {
                if (error) {
                    logger.error('Add notification error: ', error);
                }
                return cb(error, notification);
            });
        });
    };

    this._updateNotificationTextValues = function (notificationType, notification, cb) {

        var templates = {
            url: notification.url,
            message: notification.message,
            mailSubject: notification.mailSubject,
            mailBody: notification.mailBody
        };

        self._replaceInObjectValues(templates, '{appUrl}', config.appUrl);
        self._replaceInObjectValues(templates, '{notificationId}', notification.id);

        async.parallel(
            [
                function isProjectNotification( callback ) {
                    if(notificationType.applicationContext != NotificationType.applicationContexts.PROJECT){
                        return callback();
                    }
                    self._replaceInObjectValues(templates, '{projectId}', notification.modelId);

                    Project.findById( notification.modelId).then(function (project) {
                        if(!project){
                            return callback('Project not found');
                        }
                        self._replaceInObjectValues(templates, '{projectName}', project.name );
                        callback();
                    }).catch(function(err) {
                        callback(err.message);
                    });
                },
                function isUserNotification( callback ) {
                    if(notificationType.applicationContext != NotificationType.applicationContexts.USER){
                        return callback();
                    }
                    self._replaceInObjectValues(templates, '{userId}', notification.modelId);
                    User.findById( notification.modelId).then(function (user) {
                        if(!user){
                            return callback('User not found');
                        }
                        self._replaceInObjectValues(templates, '{userName}', user.name );
                        callback();
                    }).catch(function(err) {
                        callback(err.message);
                    });
                },
                function isWorkflowNotification( callback ) {
                    if(notificationType.applicationContext != NotificationType.applicationContexts.WORKFLOW){
                        return callback();
                    }
                    self._replaceInObjectValues(templates, '{workflowId}', notification.modelId);

                    Workflow.findById( notification.modelId).then(function (workflow) {
                        if(!workflow){
                            return callback('Workflow not found');
                        }

                        self._replaceInObjectValues(templates, '{workflowName}', workflow.name );
                        self._replaceInObjectValues(templates, '{projectId}', workflow.projectId );

                        workflow.getProject().then(function (project) {
                            if(!project){
                                return callback('Project not found');
                            }
                            self._replaceInObjectValues(templates, '{projectName}', project.name );
                            callback();
                        }).catch(function(err) {
                            callback(err.message);
                        });
                    }).catch(function(err) {
                        callback(err.message);
                    });
                },
                function isWorkflowDefinitionNotification( callback ) {
                    if(notificationType.applicationContext != NotificationType.applicationContexts.WORKFLOW_DEFINITION){
                        return callback();
                    }
                    self._replaceInObjectValues(templates, '{workflowDefinitionId}', notification.modelId);

                    WorkflowDefinition.findById( notification.modelId).then(function (workflowDefinition) {
                        if(!workflowDefinition){
                            return callback('Workflow definition not found');
                        }

                        self._replaceInObjectValues(templates, '{workflowDefinitionName}', workflowDefinition.name );
                        self._replaceInObjectValues(templates, '{projectId}', workflowDefinition.projectId );

                        workflowDefinition.getProject().then(function (project) {
                            if(!project){
                                return callback('Project not found');
                            }
                            self._replaceInObjectValues(templates, '{projectName}', project.name );
                            callback();
                        }).catch(function(err) {
                            callback(err.message);
                        });
                    }).catch(function(err) {
                        callback(err.message);
                    });
                }

            ],
            function (err) {
                if(err){
                    logger.error('Notification texts error: ', err);
                    return cb(err);
                }
                for(var i in templates){
                    if (!templates.hasOwnProperty(i)) {
                        continue;
                    }
                    notification[i] = templates[i];
                }
                cb(err, notification);
            }
        );
    };

    this._replaceInObjectValues = function (object, key, value) {
        for(var i in object){
            if (!object.hasOwnProperty(i)) {
                continue;
            }
            var objectValue = object[i];
            if(!objectValue){
                continue;
            }
            object[i] = objectValue.replace(new RegExp( key, 'gi'), value);
        }
        return object;
    };

    this._sendNotificationEmail = function(notification, notificationType, callback) {

        notification.getToUser().then(function(user) {

            var dateApiAccessed = user.dateApiAccessed;
            var now = new Date();

            if (!dateApiAccessed || ( (now.getTime() - 10000 ) > dateApiAccessed.getTime() )) {
                var mailOptions = {
                    to: [user.email],
                    subject: notification.mailSubject,
                    html: notification.mailBody
                };

                mailService.sendMail(mailOptions, function(error, message) {
                    if (error) {
                        return callback(error);
                    }

                    notification.isEmailSent = true;
                    notification.dateSent = new Date();
                    notification.save().then(function () {
                        return callback(null, notification);
                    });
                });
            } else {
                logger.debug('Do not mail message');
                return callback(null, notification);
            }
        });
    };
}

module.exports = new NotificationService();