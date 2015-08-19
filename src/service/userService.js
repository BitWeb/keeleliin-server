/**
 * Created by priit on 2.06.15.
 */
var logger = require('log4js').getLogger('user_service');
var async = require('async');
var userDaoService = require('./dao/userDaoService');
var Project = require(__base + 'src/service/dao/sql').Project;
var User = require(__base + 'src/service/dao/sql').User;
var ProjectUser = require(__base + 'src/service/dao/sql').ProjectUser;
var entuDaoService = require('./dao/entu/daoService');

var RedisSession = require( './dao/redis/models/redisSession');

function UserService() {

    var self = this;

    this.getAuthUrl = function (request, redirectUrl, cb) {

        request.redisSession = new RedisSession(null, function () {

            var postData = {
                state: request.redisSession.id,
                redirect_url: redirectUrl
            };

            entuDaoService.getAuthUrl(postData, function (err, url) {
                if (err) {
                    return cb(err);
                }

                request.redisSession.data.authUrl = url;
                request.redisSession.save();

                var data = {
                    authUrl: url,
                    token: request.redisSession.id
                };

                cb(err, data);
            });
        });
    };

    this.auth = function (request, cb) {

        async.waterfall([
            function getEntuUser(callback) {
                logger.debug('Get entu user');
                entuDaoService.getUser(request.redisSession.data.authUrl, request.redisSession.id, function (err, userResult) {
                    if (err) {
                        return callback(err);
                    }
                    if (userResult.error) {
                        return callback(userResult.error);
                    }

                    var entuUser = userResult.result.user;
                    request.redisSession.data.entuSessionKey = entuUser.session_key;
                    request.redisSession.data.entuUserId = entuUser.user_id;
                    request.redisSession.save();
                    callback(null, entuUser);
                });
            },
            function getLocalUser(entuUser, callback) {
                logger.debug('Get local user');
                userDaoService.getUserByEntuId(entuUser.user_id, function (err, user) {
                    if (err) {
                        return callback(err);
                    }

                    if(user){
                        callback( null, user, entuUser );
                    } else {
                        self._createUserFromEntuUser(entuUser, function (err, user) {
                            callback( err, user, entuUser );
                        });
                    }
                });
            },
            function updateSession(user, entuUser, callback) {
                logger.debug('Update session');
                request.redisSession.data.userId = user.id;
                request.redisSession.save();
                return callback(null, user, entuUser);
            },
            function getEntuUserInfo(user, entuUser, callback) {
                logger.debug('Get entu user info');
                var meta = {
                    userId: request.redisSession.data.entuUserId,
                    sessionKey: request.redisSession.data.entuSessionKey
                };

                entuDaoService.getEntity( entuUser.id, meta, function (err, entity) {

                    if(err){
                       return callback(err);
                    }

                    logger.debug(entity);

                    var result = entity.result;


                    callback(err, result, user)
                });
            },
            function updateUserEntity(entity, user, callback) {

                if(!entity){
                    logger.error('Entu entity not found for user: ' + user.id);
                    return callback(null, user);
                }

                logger.debug('Update user entity');
                user.name = entity.displayname;
                user.displaypicture = entity.displaypicture;

                user.save().then(function () {
                    callback(null, user);
                }).catch(callback);
            }
        ], function (err, user) {
            logger.debug('Auth finished ', err);
            if(err){
                logger.error(err);
            }
            cb(err, user);
        });
    };

    this._createUserFromEntuUser = function (entuUser, cb) {

        var userParams = {
            entuId: entuUser.user_id,
            email: entuUser.email,
            name: entuUser.name
        };

        self.createNewUser(userParams, cb);
    };

    this.createNewUser = function (userParams, cb) {
        logger.debug('Create New User', userParams);

        User.create(userParams).then(function (user) {

            var project = Project.build({
                name: 'Projekt 1',
                description: 'Minu esimene projekt'
            });
            logger.debug('User Add project');
            user.addProject(project).then(function () {
                logger.debug('User Add userProject');
                user.addUserProject(project, {role: ProjectUser.roles.ROLE_OWNER}).then(function () {
                    logger.debug('Vaikimisi project loodud');
                    cb(null, user);
                }).catch(function (err) {
                    return cb({
                        message: err.message,
                        code: 500
                    });
                });
            });
        }).catch(function(err) {
            return cb({
                message: err.message,
                code: 500
            });
        });
    };

    this.getCurrentUser = function (request, cb) {
        var userId = request.redisSession.data.userId;
        return userDaoService.findById(userId, cb);
    };

    this.getUser = function(req, userId, cb) {

        return userDaoService.findById(userId, cb);
    };

    this.saveUser = function(req, userId, userData, cb) {
        self.getUser(req, userId, function(error, user) {
            if (error) {
                return cb(error);
            }
            user.updateAttributes(userData).then(function(user) {
                return cb(null, user);
            }).catch(function(error) {
                return cb({
                    message: error.message,
                    code: 500
                });
            });
        });
    };

    this.registerApiAccess = function(req, userId, callback) {
        self.getUser(req, userId, function(error, user) {
            if (error) {
                return callback(error);
            }
            return self.saveUser(req, user.id, {dateApiAccessed: new Date()}, callback);
        });
    };

    this.logout = function (request, cb) {
        request.redisSession.delete(cb);
    };
}

module.exports = new UserService();