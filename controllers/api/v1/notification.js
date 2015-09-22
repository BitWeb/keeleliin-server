var express = require('express');
var router = express.Router();
var notificationService = require('../../../src/service/notificationService');
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;

router.get('/unread-summary', function(req, res) {
    notificationService.getCurrentUserNotificationsSummary(req, function(error, data) {
        return res.sendApiResponse(error, data);
    });
});

router.post('/read', function(req, res) {
    notificationService.readNotification(req, req.body.notificationId, function(error, notification) {
        return res.sendApiResponse(error, notification);
    });
});

module.exports = router;