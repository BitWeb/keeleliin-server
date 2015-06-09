/**
 * Created by priit on 27.05.15.
 */

var logger = require('log4js').getLogger('router_debugger');

module.exports = function(req, res, next){
    logger.info('Something is happening in: ' + req.url);
    next();
};