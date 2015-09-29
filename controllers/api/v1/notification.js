var express = require('express');
var router = express.Router();
var notificationService = require('../../../src/service/notificationService');
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;
var authMiddleware = require(__base + 'middlewares/auth');

router.get('/unread-summary', authMiddleware('regular'), function(req, res) {
    notificationService.getCurrentUserNotificationsSummary(req, function(error, data) {
        return res.sendApiResponse(error, data);
    });
});

router.get('/list', authMiddleware('regular'), function(req, res) {
    notificationService.getNotificationsList(req, req.query, function(err, data) {
        return res.sendApiResponse( err, data);
    });
});

router.put('/read', authMiddleware('regular'), function(req, res) {
    notificationService.readNotification(req, req.body.notificationId, function(error, notification) {
        return res.sendApiResponse(error, notification);
    });
});

module.exports = router;