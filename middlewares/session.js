/**
 * Created by priit on 3.06.15.
 */
var logger = require('log4js').getLogger('session_middleware');
var config = require('../config');
var RedisSession = require('../src/service/dao/redis/models/redisSession');

module.exports = function (req, res, next) {

    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    req.redisSession = new RedisSession( token, function () {
        next();
    });
};