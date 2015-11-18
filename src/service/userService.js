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
var notificationService = require('./notificationService');
var RedisSession = require( './dao/redis/models/redisSession');
var ObjectUtils = require('../util/objectUtils');

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
                userDaoService.getUserByEntuId(entuUser.id, function (err, user) {
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
                request.redisSession.data.role = user.role;
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
            entuId: entuUser.id,
            email: entuUser.email,
            name: entuUser.name
        };

        self.createNewUser(userParams, cb);
    };

    this.createNewUser = function (userParams, cb) {
        logger.debug('Create New User', userParams);

        User.create(userParams).then(function (user) {

            Project.create({
                name: 'Projekt 1',
                description: 'Minu esimene projekt',
                userId: user.id
            }).then(function (project) {
                logger.debug('User Add userProject');
                ProjectUser.create({
                    userId: user.id,
                    projectId: project.id,
                    role: ProjectUser.roles.ROLE_OWNER
                }).then(function () {
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

    this.getCurrentUserMainProperties = function (request, cb) {

        self.getCurrentUser(request, function (err, user) {
            if(err){
               logger.error(err);
                return cb(err);
            }
            var response = ObjectUtils.mapProperties(user, ['id','entuId', 'email', 'name', 'displaypicture', 'role', 'isActive', 'createdAt']);
            cb(null, response);
        });
    };

    this.getUser = function(req, userId, cb) {
        return userDaoService.findById(userId, cb);
    };

    this.updateUser = function(req, userId, userData, cb) {
        self.getUser(req, userId, function(error, user) {
            if (error) {
                return cb(error);
            }
            user.updateAttributes(userData, ['role','isActive','discMax']).then(function(user) {
                return cb(null, user);
            }).catch(function(error) {
                return cb({
                    message: error.message,
                    code: 500
                });
            });
        });
    };

    this.registerApiAccess = function(req, callback) {

        var userId = req.redisSession.data.userId;
        self.getUser(req, userId, function(error, user) {
            if (error) {
                return callback(error);
            }

            user.updateAttributes({dateApiAccessed: new Date()}).then(function(user) {
                notificationService.getCurrentUserNotificationsSummary(req, function(error, data) {
                    callback( error, data );
                });
            }).catch(function(error) {
                return cb({
                    message: error.message,
                    code: 500
                });
            });

        });
    };

    this.logout = function (request, cb) {
        request.redisSession.delete(cb);
    };

    this.getUserGridList = function ( req, query, cb ) {

        userDaoService.getUsersWithCount( query , function (err, users) {
            var updatedUsers = [];
            for(i in users.rows){
                users.rows[i] = ObjectUtils.snakeToCame(users.rows[i])
            }
            cb( err, users );
        });
    };


}

module.exports = new UserService();