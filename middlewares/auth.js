/**
 * Created by priit on 10.06.15.
 */
var logger = require('log4js').getLogger('auth_middleware');

var userService = require('../src/service/userService');

module.exports = function(req, res, next){

    var userId = req.redisSession.data.userId;
    if(userId){
        return next();
    }

    userService.auth(req, function (error, userId) {
        if(error){
            logger.error('Auth error');
            logger.error(error);
            return res.send(401, {errors: 'User not found'});
        }
        return next();
    });
};