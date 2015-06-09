/**
 * Created by priit on 3.06.15.
 */
var logger = require('log4js').getLogger('session_middleware');
var config = require('../config');
var uid = require('uid-safe').sync;
var RedisSession = require('../src/service/dao/redis/models/redisSession');

module.exports = function (req, res, next) {

    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if(!token){
        token = uid(24);
        logger.info('New session: ' + token);
    }

    req.redisSession = new RedisSession( token, function () {
        next();
    });
};