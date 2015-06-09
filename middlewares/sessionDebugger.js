/**
 * Created by priit on 8.06.15.
 */

var logger = require('log4js').getLogger('session_debugger');

module.exports = function(req, res, next){

    logger.info('Debug session');
    logger.info(req.redisSession.data);
    next();
};