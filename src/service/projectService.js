/**
 * Created by priit on 9.06.15.
 */

var logger = require('log4js').getLogger('project_service');
var projectDaoService = require('./dao/projectDaoService');
var Project = require(__base + 'src/service/dao/sql').Project;
var ProjectUser = require(__base + 'src/service/dao/sql').ProjectUser;
var userService = require('./userService');
var userDaoService = require('./dao/userDaoService');
var async = require('async');
var notificationService = require(__base + 'src/service/notificationService');
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;
var ArrayUtil = require('../util/arrayUtils');
var ObjectUtil = require('../util/objectUtils');

function ProjectService(){

    var self = this;

    this.getProject = function(req, projectId, callback) {
        Project.find({ where: { id: projectId }}).then(function(project) {
            if (!project) {
                return callback('Project not found.');
            }
            return callback(null, project);
        }).catch(function(error) {
            return callback(error);
        });
    };

    this.getCurrentUserProjectsList = function (req, cb) {

        var userId = req.redisSession.data.userId;
        return projectDaoService.getUserProjectsList( userId, req.query, function (err, result) {

            if(err){
                logger.error(err);
                return cb(err);
            }

            logger.debug('Projects result: ', result);

            async.map(
                result.rows,
                function (row, callback) {

                    var newItem = {
                        id:  row.id,
                        name:  row.name,
                        description:  row.description,
                        createdAt:  row.created_at,
                        updatedAt:  row.updated_at,
                        accessStatus:  row.access_status,
                        canDelete: false
                    };

                    project = Project.build( newItem );

                    project.getProjectUsers().then(function (projectUsers) {

                    async.map(
                        projectUsers,
                        function (projectUser, puCallback) {

                            if(projectUser.id == userId && projectUser.projectUser.role == ProjectUser.roles.ROLE_OWNER){
                                newItem.canDelete = true;
                            }

                            var pu = {
                                id: projectUser.id,
                                name: projectUser.name,
                                displaypicture: projectUser.displaypicture,
                                role: projectUser.projectUser.role
                            };
                            puCallback(null, pu);
                        },
                        function (err, userResult) {
                            newItem.projectUsers = userResult;
                            callback(err, newItem);
                        });
                    });
                },
                function (err, finalResult) {
                    result.rows = finalResult;
                    cb(err, result);
                });
        });
    };

    this.getCurrentUserProject = function (req, projectId, callback) {
        var userId = req.redisSession.data.userId;
        return projectDaoService.getUserProject( userId, projectId, function( err, project ){
            project = project.toJSON();
            project.projectUsers = project.projectUsers.map(function (projectUser) {
                var updatedUser = {};
                updatedUser.id = projectUser.id;
                updatedUser.name = projectUser.name;
                updatedUser.displaypicture = projectUser.displaypicture;
                updatedUser.role = projectUser.projectUser.role;
                return updatedUser;
            });
            callback(err, project);
        });
    };

    this.createCurrentUserProject = function(req, projectData, cb){

        async.waterfall([
            function getCurrentUser( callback ) {
                userService.getCurrentUser(req, function (err, user) {
                    callback(err, user);
                });
            },
            function createProject( currentUser, callback ){
                projectData.userId = currentUser.id;
                 Project.create(projectData).then(function(project) {
                    callback(null, project, currentUser)
                }).catch(function (e) {
                    return callback(e.message);
                });
            },
            function addOwnerRelation(project, currentUser, callback) {
                project.addProjectUser(currentUser, {role: ProjectUser.roles.ROLE_OWNER}).then(function () {
                    return callback(null, project);
                }).catch(function (e) {
                    return callback(e);
                });
            },
            function updateUserRelations( project, callback) {
                self._updateProjectUserRelations(req, project, projectData.users, callback);
            }
        ], function (err, project) {
            cb(err, project);
        });
    };

    this.updateCurrentUserProject = function(req, projectId, updateData, cb){

        var userId = req.redisSession.data.userId;

        async.waterfall([
                function getProject(callback) {
                    projectDaoService.getProject(projectId, callback);
                },
                function updateProject(project, callback) {
                    project.updateAttributes(updateData, {fields:['name', 'description', 'purpose','accessStatus']}).then(function () {
                        callback(null, project);
                    }).catch(function (e) {
                        return callback(e);
                    });
                },
                function updateUserRelations( project, callback) {
                    self._updateProjectUserRelations(req, project, updateData.users, callback);
                }
            ], function (err) {
                if(err){
                    logger.error(err);
                    return cb(err);
                }
                return projectDaoService.getUserProject( userId, projectId, cb);
            }
        );
    };

    /**
     * @param req
     * @param project
     * @param newRelations [{userId: "", role:""}]
     * @param cb
     * @returns {*}
     * @private
     */
    this._updateProjectUserRelations = function (req, project, newRelations, cb) {

        if(!newRelations){
            return cb(null, project);
        }

        var currentUser;

        async.waterfall([
            function getCurrentUser( callback ) {
                userService.getCurrentUser(req, function (err, user) {
                    currentUser = user;
                    callback(err);
                });
            },
            function getRelations( callback ) {
                logger.debug('Get relations');
                project.getProjectUserRelations().then(function (existingRelations) {
                    callback(null, existingRelations);
                });
            },
            function isCurrentUserInOwnerRelation(existingRelations, callback) {
                logger.debug('Is current user in owner');
                var currentOwnerRelation = ArrayUtil.find(existingRelations, function (projectUser) {
                   return projectUser.userId == currentUser.id && projectUser.role == ProjectUser.roles.ROLE_OWNER
                });

                if(currentOwnerRelation){
                    return callback( null, existingRelations);
                }

                logger.info('User is not owner in projectuser relation');
                return cb(null, project);
            },

            function removeOrUpdateRelations(existingRelations, callback) {
                logger.debug('Remove or update relations');
                async.eachOfSeries(existingRelations, function (existingRelation, key, innerCb) {

                    if(existingRelation.userId == currentUser.id) { // do not update current user record
                        return innerCb();
                    }

                    var updateRelation = ArrayUtil.find(newRelations, function (newRelation) { return newRelation.userId == existingRelation.userId; });

                    if(updateRelation){

                        if( ObjectUtil.hasKeyValue(ProjectUser.roles, updateRelation.role) ){
                            existingRelation.role = updateRelation.role;

                            logger.debug('Update', existingRelation);

                            existingRelation.save().then(function () {
                                innerCb();
                            });
                        }
                    } else {
                        logger.debug('Remove', existingRelation);

                        existingRelation.destroy().then(function () {
                            innerCb();
                        });
                    }
                }, function (err) {
                    callback(err);
                });
            },
            function addNewRelations( callback ){
                logger.debug('Add new relations');

                project.getProjectUserRelations().then(function (existingRelations) {

                    logger.debug('New relations', newRelations);

                   async.eachOfSeries( newRelations ,
                       function (newRelation, key, innerCb) {

                           logger.debug('New relation', newRelation);

                           var oldRelation = ArrayUtil.find(existingRelations, function (existingRelation) {
                               return existingRelation.userId == newRelation.userId;
                           });

                           if(!oldRelation && ObjectUtil.hasKeyValue(ProjectUser.roles, newRelation.role)){
                               logger.debug('No relation for: ', newRelation);

                                userDaoService.findById(newRelation.userId, function (err, user) {
                                    if(err){
                                        return innerCb(err.message);
                                    }
                                    project.addProjectUser(user, {role: newRelation.role}).then(function () {
                                        notificationService.addNotification(user.id, NotificationType.codes.PROJECT_USER_ADDED, project.id, function () {});
                                        return innerCb();
                                    }).catch(function (e) {
                                        return innerCb(e.message);
                                    });
                                });
                           } else {
                                return innerCb();
                           }
                       },
                       function (err) {
                            callback(err);
                       }
                   );
                });
            }
        ], function (err) {
            if(err){
                logger.error(err);
            }
            cb(err, project);
        });
    };

    this.deleteCurrentUserProject = function (req, projectId, callback) {

        // todo: kustuta seotud andmeobjektid
        var userId = req.redisSession.data.userId;

        projectDaoService.getUserProject( userId, projectId, function (err, project) {
            if(err){
                return callback( err );
            }

            project.destroy().then(function () {
                return callback();
            }).catch(function (error) {
                return callback( error.message );
            });
        });
    };

}

module.exports = new ProjectService();