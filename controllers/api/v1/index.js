/**
 * Created by priit on 3.06.15.
 */

var express = require('express');
var router = express.Router();
var config = require(__base + 'config');

router.use('/user', require(__base + 'controllers/api/v1/user'));

/* GET API home */
router.get('/', function(req, res, next) {
    res.send({api:'Hello World'});
});

module.exports = router;
