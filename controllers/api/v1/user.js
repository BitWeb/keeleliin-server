/**
 * Created by priit on 5.06.15.
 */

var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger('user_controller');
var userService = require('../../../src/service/userService');

router.get('/', function(req, res, next) {
    userService.getCurrentUser(req, function (error, user) {
        if(error){
            return res.send(error);
        }
        return res.send(user);
    });
});

router.get('/login/:redirectUrl', function(req, res, next) {

    if(!req.redisSession || !req.redisSession.data.user){

        var redirectUrl = req.params.redirectUrl;

        userService.getAuthUrl( req, redirectUrl, function (error, url) {
            if(error){
                return res.send(error);
            }
            res.send({ authUrl: url, token: req.redisSession.id });
        });
        return;
    }

    res.send( req.session.user );
});

router.get('/logout', function(req, res, next) {

    userService.logout( req, function () {
        res.send( {success: true} );
    });
});

module.exports = router;
