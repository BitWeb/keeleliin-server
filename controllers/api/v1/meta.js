var logger = require('log4js').getLogger('breadcrumb_controller');
var express = require('express');
var router = express.Router();
var metaService = require('../../../src/service/metaService');

/**
 * breadcrumb
 */
router.get('/breadcrumb', function(req, res) {
    metaService.getBreadcrumbFields(req, req.query, function(error, data) {
        return res.sendApiResponse( error, data);
    });
});

module.exports = router;