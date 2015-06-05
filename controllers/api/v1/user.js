/**
 * Created by priit on 5.06.15.
 */

var express = require('express');
var router = express.Router();

var UserService = require('../../../src/service/userService');

router.get('/', function(req, res, next) {

    UserService.getEntuUser(req, function (error, user) {
        if(error){
            return res.send(error);
        }
        return res.send(user);
    });
});

router.get('/login', function(req, res, next) {

    if(!req.session || !req.session.user){

        var redirectUrl = req.protocol + '://' + req.get('host') + '/api/v1/user/loginback';

        UserService.getAuthUrl( req, redirectUrl, function (error, url) {
            if(error){
                return res.send(error);
            }
            res.send({ authUrl: url });
        });
        return;
    }

    res.send( req.session.user );
});

router.get('/loginback', function(req, res, next) {

    console.log(req.session);

    if(!req.session.user){
        UserService.getEntuUser( req, function (url) {
            res.send( req.session.user );
        });
        return;
    }

    res.send( req.session.user );
});

router.get('/logout', function(req, res, next) {

    UserService.logout( req, function () {
        res.send( {logout: 'OK'} );
    });
});

module.exports = router;
