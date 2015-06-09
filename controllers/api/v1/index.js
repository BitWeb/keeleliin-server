/**
 * Created by priit on 3.06.15.
 */

var express = require('express');
var router = express.Router();
var config = require(__base + 'config');
var UserService = require('../../../src/service/userService');

/* GET API home */
router.get('/', function(req, res, next) {
    res.send({api:'Keeleliin v1'});
});

router.use('/user', require(__base + 'controllers/api/v1/user'));

var checkToken = function (req, res, next) {

    var userId = req.redisSession.data.userId;
    if(userId){
        return next();
    }

    UserService.auth(req, function (error, userId) {
        if(error){
            console.log('Auth error');
            console.log(error);
            return res.send(401, {errors: 'Usr not found'});
        }
        return next();
    });
};

router.use('/service',checkToken , require(__base + 'controllers/api/v1/service'));

module.exports = router;
