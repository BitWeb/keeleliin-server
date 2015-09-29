/**
 * Created by priit on 3.06.15.
 */

var express = require('express');
var router = express.Router();
var config = require(__base + 'config');
var logger = require('log4js').getLogger('index_controller');
var authMiddleware = require(__base + 'middlewares/auth');

/* GET API home */
router.get('/', authMiddleware('guest'), function(req, res) {
    res.send({api:'Keeleliin API V1'});
});

router.use('/user', require(__base + 'controllers/api/v1/user'));
router.use('/project', require(__base + 'controllers/api/v1/project'));
router.use('/resource', require(__base + 'controllers/api/v1/resource'));
router.use('/service', require(__base + 'controllers/api/v1/service'));
router.use('/notification', require(__base + 'controllers/api/v1/notification'));
router.use('/workflow', require(__base + 'controllers/api/v1/workflow'));
router.use('/workflow-definition', require(__base + 'controllers/api/v1/workflowDefinition'));
router.use('/resource-type', require(__base + 'controllers/api/v1/resourceType'));
router.use('/meta', require(__base + 'controllers/api/v1/meta'));

module.exports = router;
