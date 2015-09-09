/**
 * Created by priit on 27.05.15.
 */

var logger = require('log4js').getLogger('router_middleware');

module.exports = function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Auth-UserId, X-Auth-Token, x-access-token, Cache-Control");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, PUT");

    logger.info('Something is happening in: ' + req.url + ' ' + req.method);

    if(req.method == 'OPTIONS'){
        return res.send('OK');
    }

    next();
};