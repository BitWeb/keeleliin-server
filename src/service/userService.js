/**
 * Created by priit on 2.06.15.
 */
var logger = require('log4js').getLogger('user_service');
var userDaoService = require('./dao/userDaoService');
var Project = require(__base + 'src/service/dao/sql').Project;

function UserService() {

    var self = this;

    this.getAuthUrl = function (request, redirectUrl, callback) {

        var postData = {
            state: request.redisSession.id,
            redirect_url: redirectUrl
        };

        return userDaoService.getAuthUrl(postData, function (err, url) {
            if(err){
                return callback(err);
            }

            request.redisSession.data.authUrl = url;
            request.redisSession.save();
            callback(err, url);
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

                    self.createNewUser(userParams, function (err, user) {
                        if(err){
                            callback(err);
                        }
                        request.redisSession.data.userId = user.id;
                        request.redisSession.save();
                        return callback(null, user.id);
                    });
                }
            });
        });
    };

    this.createNewUser = function (userParams, callback) {
        userDaoService.create(userParams, function (err, user) {

            var project = Project.build({
                name: 'Projekt 1',
                description: 'Minu esimene projekt'
            });

            user.addProject( project).then(function () {
                logger.debug('Vaikimisi project loodud');
                callback(err, user);
            });
        });
    };

    this.getCurrentUser = function (request, callback) {
        return userDaoService.findById(request.redisSession.data.userId, callback);
    };

    this.logout = function (request, callback) {
        request.redisSession.delete(callback);
    };
}

module.exports = new UserService();