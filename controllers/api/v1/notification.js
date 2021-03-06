var express = require('express');
var router = express.Router();
var notificationService = require('../../../src/service/notificationService');
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;
var authMiddleware = require(__base + 'middlewares/auth');

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

router.put('/read-all', authMiddleware('regular'), function(req, res) {
    notificationService.readAllNotifications(req, function(error) {
        return res.sendApiResponse(error);
    });
});

router.delete('/:notificationId', authMiddleware('regular'), function(req, res) {
    notificationService.deleteNotification(req, req.params.notificationId, function(error) {
        return res.sendApiResponse(error);
    });
});

module.exports = router;