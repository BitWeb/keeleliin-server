/**
 * Created by priit on 2.06.15.
 */
var logger = require('log4js').getLogger('user_service');
var userDaoService = require('./dao/userDaoService');

function UserService() {

    this.getAuthUrl = function (request, redirectUrl, callbac) {

        var postData = {
            state: request.redisSession.id,
            redirect_url: redirectUrl
        };

        return userDaoService.getAuthUrl(postData, function (err, url) {
            if(err){
                return callbac(err);
            }

            request.redisSession.data.authUrl = url;
            request.redisSession.save();
            callbac(err, url);
        });
    };

    this.auth = function (request, callback) {

        userDaoService.getEntuUser(request.redisSession.data.authUrl, request.redisSession.id, function (err, entuUser) {
            if(err){
                logger.error('getUser Error');
                logger.error(err);
                return callbac(err);
            }

            userDaoService.getUserByEntuId(entuUser.user_id, function (err, user) {
                if(err){
                    logger.error(err);
                    return callback(err);
                }

                if(user){
                    request.redisSession.data.userId = user.id;
                    request.redisSession.save();
                    return callback(null, user.id);
                } else {

                    var userParams = {
                        entu_id: entuUser.user_id,
                        email: entuUser.email,
                        name: entuUser.name
                    };

                    userDaoService.create(userParams, function (user) {
                        request.redisSession.data.userId = user.id;
                        request.redisSession.save();
                        return callback(null, user.id);
                    });
                }
            });
        });
    };

    this.getCurrentUser = function (request, callbac) {
        return userDaoService.findById(request.redisSession.data.userId, callbac);
    };

    this.logout = function (request, callback) {
        delete request.session.user;
        delete request.session.state;
        delete request.session.authUrl;
        request.redisSession.data = {};
        request.redisSession.save();
        callback();
    };

}

module.exports = new UserService();