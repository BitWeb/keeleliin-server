/**
 * Created by priit on 2.06.15.
 */
var express = require('express');
var router = express.Router();

var UserService = require('../src/service/userService');

router.get('/login', function(req, res, next) {

    console.log(req.session);

    if(!req.session.user){
        UserService.getAuthUrl( req, function (error, url) {
            if(error){
                return res.send(error);
            }
            res.redirect(url);
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

router.get('/entities', function(req, res, next) {

    UserService.getEntuEntities( req, function (data) {
        res.send( data );
    });
});

module.exports = router;
