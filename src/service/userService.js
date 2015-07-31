/**
 * Created by priit on 2.06.15.
 */
var logger = require('log4js').getLogger('user_service');
var userDaoService = require('./dao/userDaoService');
var Project = require(__base + 'src/service/dao/sql').Project;

function UserService() {

    var self = this;

    this.getAuthUrl = function (request, redirectUrl, cb) {

        var postData = {
            state: request.redisSession.id,
            redirect_url: redirectUrl
        };

        userDaoService.getAuthUrl(postData, function (err, url) {
            if(err){ return cb(err); }

            request.redisSession.data.authUrl = url;
            request.redisSession.save();
            cb(err, url);
        });
    };

    this.auth = function (request, cb) {

        userDaoService.getEntuUser(request.redisSession.data.authUrl, request.redisSession.id, function (err, entuUser) {
            if(err){ return cb(err); }

            userDaoService.getUserByEntuId(entuUser.user_id, function (err, user) {
                if(err){
                    logger.error(err);
                    return cb(err);
                }

                if(user){
                    request.redisSession.data.userId = user.id;
                    request.redisSession.save();
                    return cb(null, user.id);
                } else {

                    var userParams = {
                        entu_id: entuUser.user_id,
                        email: entuUser.email,
                        name: entuUser.name
                    };

                    self.createNewUser(userParams, function (err, user) {
                        if(err){
                            cb(err);
                        }
                        request.redisSession.data.userId = user.id;
                        request.redisSession.save();
                        return cb(null, user.id);
                    });
                }
            });
        });
    };

    this.createNewUser = function (userParams, cb) {
        userDaoService.create(userParams, function (err, user) {

            var project = Project.build({
                name: 'Projekt 1',
                description: 'Minu esimene projekt'
            });

            user.addProject( project).then(function () {
                logger.debug('Vaikimisi project loodud');
                cb(err, user);
            });
        });
    };

    this.getCurrentUser = function (request, cb) {
        return userDaoService.findById(request.redisSession.data.userId, cb);
    };

    this.logout = function (request, cb) {
        request.redisSession.delete(cb);
    };
}

module.exports = new UserService();