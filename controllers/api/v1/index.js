/**
 * Created by priit on 3.06.15.
 */

var express = require('express');
var router = express.Router();
var config = require(__base + 'config');
var logger = require('log4js').getLogger('index_controller');

var authMiddleware = require(__base + 'middlewares/auth');

/* GET API home */
router.get('/', function(req, res) {
    res.send({api:'Keeleliin API V1'});
});

router.use('/user', require(__base + 'controllers/api/v1/user'));
router.use('/project', authMiddleware, require(__base + 'controllers/api/v1/project'));
router.use('/resource', authMiddleware, require(__base + 'controllers/api/v1/resource'));
router.use('/service', authMiddleware, require(__base + 'controllers/api/v1/service'));
router.use('/notification', authMiddleware, require(__base + 'controllers/api/v1/notification'));
router.use('/workflow', authMiddleware, require(__base + 'controllers/api/v1/workflow'));
router.use('/workflow-definition', authMiddleware, require(__base + 'controllers/api/v1/workflowDefinition'));
router.use('/resource-type', authMiddleware, require(__base + 'controllers/api/v1/resourceType'));
router.use('/meta', require(__base + 'controllers/api/v1/meta'));

module.exports = router;
