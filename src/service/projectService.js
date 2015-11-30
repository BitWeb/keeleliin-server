/**
 * Created by priit on 9.06.15.
 */

var logger = require('log4js').getLogger('project_service');
var projectDaoService = require('./dao/projectDaoService');
var Project = require(__base + 'src/service/dao/sql').Project;
var User = require(__base + 'src/service/dao/sql').User;
var ProjectUser = require(__base + 'src/service/dao/sql').ProjectUser;
var userService = require('./userService');
var userDaoService = require('./dao/userDaoService');
var async = require('async');
var notificationService = require(__base + 'src/service/notificationService');
var resourceService = require(__base + 'src/service/resourceService');
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;
var ArrayUtil = require('../util/arrayUtils');
var ObjectUtil = require('../util/objectUtils');

var ResourceAssociation = require(__base + 'src/service/dao/sql').ResourceAssociation;
var resourceDaoService = require(__base + 'src/service/dao/resourceDaoService');


function ProjectService(){

    var self = this;

    this.canViewProjectById = function (req, projectId, cb) {
        userService.getCurrentUser(req, function (err, user) {
            if(err){
                return cb(err);
            }
            if(user.role == User.roles.ROLE_ADMIN){
                return cb( null, true);
            }
            self.getProject(req, projectId, function (err, project) {
                if(err){
                    return cb(err);
                }
                project.getProjectUserRelations({ where: { userId: user.id } }).then(function (relations) {
                    return cb(null, relations.length === 1);
                });
            });
        });
    };

    this.canEditProjectById = function (req, projectId, cb) {
        userService.getCurrentUser(req, function (err, user) {
            if(err){
                return cb(err);
            }
            if(user.role == User.roles.ROLE_ADMIN){
                return cb( null, true);
            }

            self.getProject(req, projectId, function (err, project) {
                if(err){
                    return cb(err);
                }
                project.getProjectUserRelations({
                    where: {
                        userId: user.id,
                        $or: [
                            { role: ProjectUser.roles.ROLE_EDITOR },
                            { role: ProjectUser.roles.ROLE_OWNER }
                        ]
                    }
                }).then(function (relations) {
                    return cb(null, relations.length === 1);
                });
            });
        });
    };


    this.getProject = function(req, projectId, callback) {
        Project.findById( projectId ).then(function(project) {
            if (!project) {
                return callback('Projekti ei leitud');
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

                    var project = Project.build( newItem );
                    project.getProjectUsers().then(function (projectUsers) {

                    async.map(
                        projectUsers,
                        function (projectUser, puCallback) {

                            if( projectUser.id == userId && projectUser.projectUser.role == ProjectUser.roles.ROLE_OWNER ){
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
        self._getUserProjectViewData(userId, projectId, callback);
    };

    this._getUserProjectViewData = function (userId, projectId, callback) {

        projectDaoService.getProjectViewData(userId, projectId, function( err, project ){
            if(!project){
                return callback('Kasutaja projekti ei leitud');
            }
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

                ProjectUser.create({
                    userId: currentUser.id,
                    projectId: project.id,
                    role: ProjectUser.roles.ROLE_OWNER
                }).then(function (projectuser) {
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

                return self._getUserProjectViewData(userId, projectId, cb);
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
                logger.debug('Is current user in editor');

                var currentEditorRelation = ArrayUtil.find(existingRelations, function (projectUser) {
                   return projectUser.userId == currentUser.id && ( projectUser.role == ProjectUser.roles.ROLE_OWNER || projectUser.role == ProjectUser.roles.ROLE_EDITOR );
                });

                if(currentEditorRelation){
                    return callback( null, existingRelations);
                }

                logger.info('User is not editor in projectuser relations');
                return cb(null, project);
            },

            function removeOrUpdateRelations(existingRelations, callback) {

                if(project.accessStatus == Project.accessStatuses.PRIVATE){
                    newRelations = [];
                }

                logger.debug('Remove or update relations');
                async.eachOfSeries(existingRelations, function (existingRelation, key, innerCb) {

                    if(existingRelation.role == ProjectUser.roles.ROLE_OWNER) { // do not update owner user record
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

                                User.findById(newRelation.userId).then(function ( user ) {

                                    ProjectUser.create({
                                        userId: user.id,
                                        projectId: project.id,
                                        role: newRelation.role
                                    }).then(function () {
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

    this.deleteCurrentUserProject = function (req, projectId, cb) {

        async.waterfall([
                function (callback) {
                    var userId = req.redisSession.data.userId;

                    projectDaoService.getUserProject( userId, projectId, function (err, project) {
                        callback( err, project )
                    });
                },
                function (project, callback) {
                    project.getResourceAssociations().then(function (associations) {
                        logger.debug( ' Got associations to delete: ' + associations.length );
                        async.eachSeries(associations, function (association, innerCb) {
                            resourceService.deleteAssociation( association, function (err) {
                                logger.debug('Association deleted');
                                innerCb(err);
                            });
                        }, function (err) {
                            callback(err, project);
                        });
                    });
                },
                function (project, callback) {
                    project.destroy().then(function () {
                        return callback();
                    }).catch(function (error) {
                        return callback( error.message );
                    });
                }
        ],
            function ( err ) {
                if(err){
                    logger.error();
                }
                cb(err);
            }
        );
    };

    this.addResources = function(req, projectId, data, cb){

        logger.trace('Add resources', data);

        async.waterfall([
            function (callback) {
                self.getProject(req, projectId, function (err, project) {
                    callback(err, project);
                })
            },
            function ( project, callback ) {
                async.eachLimit(data.resources, 10, function (resourceId, innerCallback) {
                    if(!resourceId){
                        return innerCallback();
                    }
                    resourceDaoService.getResource(resourceId, function (err, resource) {
                        if(err){
                            logger.error(err);
                            return innerCallback();
                        }

                        var associationData = {
                            context: ResourceAssociation.contexts.PROJECT_FILE,
                            resourceId: resource.id,
                            userId: req.redisSession.data.userId,
                            projectId: projectId
                        };

                        resourceService.createAssociation(associationData, innerCallback);
                    });
                }, function (err) {
                    callback(err);
                });
            }
        ], function (err) {
            if(err){
                logger.error(err);
            }
            cb(err);
        })
    };

    this.addEntuResources = function(req, projectId, data, cb){

        logger.trace('Add entu resources', data);

        async.waterfall([
            function (callback) {
                self.getProject(req, projectId, function (err, project) {
                    callback(err, project);
                });
            },
            function (project, callback) {
                async.eachLimit(data.files, 10, function (fileId, innerCallback) {
                    if(!fileId){
                        return innerCallback();
                    }
                    resourceService.createResourceFromEntu(req, projectId, null, fileId, function (err, resource) {
                        innerCallback(err);
                    });
                }, function (err) {
                    callback(err);
                });
            }
        ], function (err) {
            if(err){
                logger.error(err);
            }
            cb(err);
        })
    };

}

module.exports = new ProjectService();