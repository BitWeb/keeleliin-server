var notificationDaoService = require('./dao/notificationDaoService');
var Notification = require(__base + 'src/service/dao/sql').Notification;
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;
var userService = require(__base + 'src/service/userService');
var async = require('async');
var mailService = require(__base + 'src/service/mailService');
var logger = require('log4js').getLogger('notification_service');

function NotificationService() {

    var TIME_SEND_MAIL_ENABLED_AFTER_API_ACCESS = 5; // in minutes

    var self = this;

    this.getNotification = function(notificationId, callback) {
        Notification.find({where: {id: notificationId}}).then(function(notification) {
            if (!notification) {
                return callback('Notification not found.')
            }
            return callback(null, notification);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.getNotificationByUserAndCodeAndModel = function(userId, code, modelId, callback) {

        return notificationDaoService.getNotificationByUserAndCodeAndModel(userId, code, modelId, callback);
    };

    this.getNotificationTypeByCode = function(code, callback) {
        NotificationType.find({where: {code: code}}).then(function(notificationType) {
            if (!notificationType) {
                return callback('Notification type with code "' + code + '" not found.')
            }
            return callback(null, notificationType);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.getNotificationsUnreadByUser = function(req, userId, callback) {
        userService.getUser(req, userId, function(error, user) {
            if (error) {
                return callback(error);
            }

            notificationDaoService.getNotificationsUnreadByUser(user.id, callback);
        });
    };

    this.addNotification = function(userId, code, modelId, cb) {
        self.getNotificationByUserAndCodeAndModel(userId, code, modelId, function(error, notification) {
            if (error) {
                logger.error('Add notification error: ' + error);
                return cb(error);
            }

            // Already added
            if (notification) {
                logger.debug('Notification (id: ' + notification.id + ') already added.');
                return cb(null, notification);
            }

            async.waterfall([
                function(callback) {
                    self.getNotificationTypeByCode(code, function(error, notificationType) {
                        if (error) {
                            return callback(error);
                        }

                        var notification = Notification.build({
                            notificationTypeId: notificationType.id,
                            toUserId: userId,
                            url: self._composeUrl(notificationType.urlTemplate, modelId),
                            modelId: modelId
                        });

                        notification.save().then(function(notification) {
                            return callback(null, notification);
                        }).catch(function(error) {
                            return callback({
                                message: error.message,
                                code: 500
                            })
                        })
                    });
                },

                function callback(notification, callback) {
                    notification.getNotificationType().then(function(notificationType) {
                        if (notificationType.isSendEmail) {
                            return self._sendNotificationEmail(notification, notificationType, callback);
                        }

                        return callback(null, notification);
                    });
                }
            ], function(error, notification) {
                if (error) {
                    logger.error('Add notification error: ' + error);
                }
                return cb(error, notification);
            });
        });

    };

    this.readNotification = function(req, notificationId, callback) {

        self.getNotification(req, notificationId, function(error, notificiation) {
            if (error) {
                return callback(error);
            }

            if (notificiation.isRead) {
                // Is error even needed, return only object?
                return callback('Notification is already read.', notificiation);
            }

            return self.saveNotification(req, notificiation.id, {isRead: true, dateRead: new Date()}, callback);
        });
    };

    this.saveNotification = function(notificationId, notificationData, callback) {
        self.getNotification(notificationId, function(error, notification) {
            if (error) {
                return callback(error);
            }

            notification.updateAttributes(notificationData).then(function(notification) {
                return callback(null, notification);
            }).catch(function(error) {
                return callback({
                    message: error.message,
                    code: 500
                });
            });
        });
    };

    this._sendNotificationEmail = function(notification, notificationType, callback) {

        notification.getToUser().then(function(user) {
            var dateApiAccessed = user.dateApiAccessed;
            var now = new Date();
            now.setMinutes(now.getMinutes() - TIME_SEND_MAIL_ENABLED_AFTER_API_ACCESS);

            if (!dateApiAccessed || (now <= dateApiAccessed)) {
                var url = self._composeUrl(notificationType.urlTemplate, notification.modelId);
                var mailOptions = {
                    to: [user.email],
                    subject: notificationType.mailSubject,
                    html: self._composeMailBody(notificationType.mailTemplate, url)
                };

                mailService.sendMail(mailOptions, function(error, message) {
                    if (error) {
                        return callback(error);
                    }

                    return self.saveNotification(notification.id, {isEmailSent: true, dateSent: new Date()}, callback);
                });
            } else {
                return callback(null, notification);
            }
        });

    };

    this._composeUrl = function(urlTemplate, modelId) {

        return urlTemplate.replace(new RegExp('{id}', 'gi'), modelId);
    };


    this._composeMailBody = function(mailTemplate, url) {

        return mailTemplate.replace(new RegExp('{url}', 'gi'), url);
    };

}

module.exports = new NotificationService();