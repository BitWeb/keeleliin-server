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
router.use('/project',authMiddleware , require(__base + 'controllers/api/v1/project'));

module.exports = router;
