/**
 * Created by priit on 5.06.15.
 */

var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger('user_controller');
var url     = require('url');
var authMiddleware = require(__base + 'middlewares/auth');
var PaginationParameters = require(__base + 'src/util/paginationParameters');
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

router.get('/list', function( req, res ) {
    var paginationParameters = new PaginationParameters(url.parse(req.url, true).query);
    userDaoService.getUsersWithCount(paginationParameters, function (err, users) {
        res.sendApiResponse( err, users );
    });
});

router.get('/details/:userId', function(req, res) {
    userService.getUser(req, req.params.userId, function(err, user) {
        res.sendApiResponse(err, user);
    });
});

router.put('/details/:userId', function(req, res) {
    userService.saveUser(req, req.params.userId, req.body, function(err, user) {
        res.sendApiResponse(err, user);
    });
});

router.post('/register-api-access', function(req, res) {
    var userId = req.redisSession.data.userId;
    userService.registerApiAccess(req, userId, function(error, user) {
        return res.sendApiResponse(error, user);
    });
});

module.exports = router;
