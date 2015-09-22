var Notification = require(__base + 'src/service/dao/sql').Notification;
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;

function NotificationDaoService() {

    this.getNotificationByUserAndCodeAndModel = function(userId, code, modelId, callback) {
        Notification.find({
            where: {
                toUserId: userId,
                modelId: modelId
            },
            include: [
                {
                    model: NotificationType,
                    as: 'notificationType',
                    where: {
                        code: code
                    },
                    required: true
                }
            ]
        }).then(function(notification) {

            return callback(null, notification);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.getLastNotificationsUnreadByUser = function(userId, callback) {

        Notification.findAll({
            where: {
                toUserId: userId,
                isRead: false
            },
            attributes: [
                'id',
                'message',
                'url',
                'createdAt'
            ],
            limit: 5,
            order: 'created_at DESC'
        }).then(function(notifications) {
            return callback(null, notifications);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.getNotificationsUnreadCountByUser = function(userId, callback) {

        Notification.count({
            where: {
                toUserId: userId,
                isRead: false
            }
        }).then(function(count) {
            return callback(null, count);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };
}

module.exports = new NotificationDaoService();