/**
 * Created by priit on 10.06.15.
 */
var logger = require('log4js').getLogger('auth_middleware');

var userService = require('../src/service/userService');

var rolesMap = {
    guest: ['guest'],
    regular: ['guest', 'regular'],
    admin: ['guest', 'regular', 'admin']
};

function isAuthorized(requiredRole, actualRole){
    requiredRole = requiredRole != undefined ? requiredRole : 'guest';
    actualRole = actualRole != undefined ? actualRole : 'guest';
    var allowedRoles = rolesMap[ actualRole ];
    return allowedRoles.indexOf(requiredRole) > -1;
}

module.exports = function ( role ) {

    return function(req, res, next){

        if(isAuthorized(role)){
            return next();
        }

        var userId = req.redisSession.data.userId;
        logger.trace('User id before auth: ' +  userId);

        if(userId){
            if(isAuthorized(role, req.redisSession.data.role)){
                return next();
            }
        }

        if( !req.redisSession.data.authUrl ){
            res.status(401);
            return res.sendApiResponse( 'Ligipääs keelatud');
        }

        userService.auth(req, function (error, user) {
            if(error || user == undefined){
                if(error){
                    return res.sendApiResponse(error);
                }
                res.status(401);
                return res.sendApiResponse( 'Ligipääs keelatud');
            }

            if(isAuthorized(role, user.role)){
                return next();
            } else {
                res.status(401);
                return res.sendApiResponse( 'Ligipääs keelatud');
            }
        });
    };
};
