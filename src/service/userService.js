/**
 * Created by priit on 2.06.15.
 */
var logger = require('log4js').getLogger('user_service');
var userDaoService = require('./dao/userDaoService');
var projectService = require('./projectService');

function UserService() {

    var self = this;

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
                return callback(err);
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

                    self.createNewUser(userParams, function (user) {
                        request.redisSession.data.userId = user.id;
                        request.redisSession.save();
                        return callback(null, user.id);
                    });
                }
            });
        });
    };

    this.createNewUser = function (userParams, callbac) {
        userDaoService.create(userParams, function (user) {

            var projectDefaultData = {
                name: 'Projekt 1',
                description: 'Minu esimene projekt'
            };

            projectService.createNewProjectForUser(projectDefaultData, user, function (project) {
                logger.debug('Project loodud');
            });

            callbac(user);
        });
    };

    this.getCurrentUser = function (request, callbac) {
        return userDaoService.findById(request.redisSession.data.userId, callbac);
    };

    this.logout = function (request, callback) {
        request.redisSession.delete(callback);
    };
}

module.exports = new UserService();