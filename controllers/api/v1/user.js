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

/**
 * Entu auth andmed
 */
router.get('/login/:redirectUrl', authMiddleware('guest'), function( req, res ) {

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

/**
 * Sisselogitud kasutaja
 */
router.get('/', authMiddleware('regular'), function( req, res ) {
    userService.getCurrentUserMainProperties(req, function (error, user) {
        if(error){
            res.status(401);
        }
        return res.sendApiResponse( error, user);
    });
});

/**
 * Logi välja
 */
router.get('/logout', authMiddleware('guest'), function( req, res ) {

    userService.logout( req, function (err) {
        res.sendApiResponse( err, {success: true} );
    });
});

/**
 * Kasutajate haldus && millegi jagamine
 */
router.get('/list', authMiddleware('regular'), function( req, res ) {

    userService.getUserGridList(req, req.query, function (err, data) {
        res.sendApiResponse( err, data );
    });
});

/**
 * Kasutaja muutmise vaade
 */
router.get('/:userId/details',authMiddleware('admin'), function(req, res) {
    userService.getUser(req, req.params.userId, function(err, user) {
        res.sendApiResponse(err, user);
    });
});

/**
 * Kasutaja muutmise vaade
 */
router.put('/:userId/details', authMiddleware('admin'), function(req, res) {
    userService.saveUser(req, req.params.userId, req.body, function(err, user) {
        res.sendApiResponse(err, user);
    });
});

/**
 * Päringud peale sisselogimist
 */
router.put('/heart-beat', authMiddleware('regular'), function(req, res) {

    userService.registerApiAccess(req, function(error, status) {
        return res.sendApiResponse(error, status);
    });
});

module.exports = router;
