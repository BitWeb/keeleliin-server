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

    return next();
};