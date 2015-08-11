/**
 * Created by taivo on 11.08.15.
 */
var logger = require('log4js').getLogger('api_access_middleware');
var userService = require('../src/service/userService');

/**
 * Not used.
 * Using API call for registering API access.
 * Maybe in the future it is needed.
 */
module.exports = function(req, res, next) {
    var userId = 1;
    if(!userId){
        return next();
    }
    var dateApiAccessed = new Date();
    userService.saveUser(req, userId, {dateApiAccessed: dateApiAccessed}, function(error, user) {
        if (error) {
            return res.sendApiResponse(error);
        }
        logger.debug('User (id: ' + userId + ') accessed API.');
        return next();
    });
};