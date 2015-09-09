/**
 * Created by priit on 10.06.15.
 */
var logger = require('log4js').getLogger('auth_middleware');

var userService = require('../src/service/userService');

module.exports = function(req, res, next){

    var userId = req.redisSession.data.userId;
    logger.trace('User id before auth: ' +  userId);
    if(userId && userId != undefined){
        return next();
    }

    if( !req.redisSession.data.authUrl ){
        res.status(401);
        return res.sendApiResponse( 'User not found');
    }

    userService.auth(req, function (error, userId) {
        if(error || userId == undefined){
            return res.send(401, {errors: 'User not found'});
        }

        return next();
    });
};