/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('entu_controller');
var express = require('express');
var router = express.Router();
var entuService = require('../../../src/service/entuService');
var fs = require('fs');
var config = require(__base + 'config');
var authMiddleware = require(__base + 'middlewares/auth');

/**
 * Ressursside nimekiri
 */
router.get('/resource-list', authMiddleware('regular'), function(req, res) {
    entuService.getResourcesList(req, function(error, resources) {
        return res.sendApiResponse( error, resources);
    });
});

module.exports = router;