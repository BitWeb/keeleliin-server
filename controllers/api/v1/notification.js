var express = require('express');
var router = express.Router();
var notificationService = require('../../../src/service/notificationService');
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;

router.get('/test', function(req, res) {

    notificationService.addNotification(1, NotificationType.codes.WORKFLOW_STILL_RUNNING, 1, function(error, notification) {
        return res.sendApiResponse(error, notification);
    });
});

router.get('/:userId/unread', function(req, res) {

    notificationService.getNotificationsUnreadByUser(req, req.params.userId, function(error, notifications) {
        return res.sendApiResponse(error, notifications);
    });
});

router.post('/read', function(req, res) {
    notificationService.readNotification(req, req.body.notificationId, function(error, notification) {
        return res.sendApiResponse(error, notification);
    });
});

module.exports = router;