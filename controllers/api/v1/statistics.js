var logger = require('log4js').getLogger('breadcrumb_controller');
var express = require('express');
var router = express.Router();
var statisticsService = require('../../../src/service/statisticsService');
var authMiddleware = require(__base + 'middlewares/auth');
/**
 * breadcrumb
 */
router.get('/', authMiddleware('admin'), function(req, res) {
    statisticsService.getServerStatistics(req, function(error, data) {
        return res.sendApiResponse( error, data);
    });
});

module.exports = router;