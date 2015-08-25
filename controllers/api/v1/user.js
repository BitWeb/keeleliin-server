/**
 * Created by priit on 5.06.15.
 */

var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger('user_controller');

var authMiddleware = require(__base + 'middlewares/auth');

var userService = require('../../../src/service/userService');
var userDaoService = require('../../../src/service/dao/userDaoService');

var entuDao = require('../../../src/service/dao/entu/daoService');


router.get('/', authMiddleware, function( req, res ) {
    userService.getCurrentUser(req, function (error, user) {
        if(error){
            res.status(401);
        }
        return res.sendApiResponse( error, user);
    });
});

router.get('/login/:redirectUrl', function( req, res ) {

    if(req.redisSession.data.userId){
        userService.getCurrentUser(req, function ( error, user ) {
            if(error){ res.status(401); }
            return res.sendApiResponse( error, user );
        });
        return;
    }

    var redirectUrl = req.params.redirectUrl;

    userService.getAuthUrl( req, redirectUrl, function (error, data) {
        res.sendApiResponse(error, data);
    });
});

router.get('/logout', function( req, res ) {

    userService.logout( req, function (err) {
        res.sendApiResponse( err, {success: true} );
    });
});

/**
 * Return active users list
 */
router.get('/list', function( req, res ) {

    userDaoService.getActiveUsersList( function (err, users) {
        res.sendApiResponse( err, users );
    });
});

router.post('/register-api-access', function(req, res) {
    var userId = req.redisSession.data.userId;
    userService.registerApiAccess(req, userId, function(error, user) {
        return res.sendApiResponse(error, user);
    });
});

module.exports = router;
