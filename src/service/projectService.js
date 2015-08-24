/**
 * Created by priit on 9.06.15.
 */

var logger = require('log4js').getLogger('project_service');
var projectDaoService = require('./dao/projectDaoService');
var Project = require(__base + 'src/service/dao/sql').Project;
var ProjectUser = require(__base + 'src/service/dao/sql').ProjectUser;
var userService = require('./userService');
var async = require('async');
var notificationService = require(__base + 'src/service/notificationService');
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;

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

            logger.debug('Projects result: ', result);

            async.map(
                result.rows,
                function (row, callback) {

                    var newItem = {
                        id:  row.id,
                        name:  row.name,
                        description:  row.description,
                        createdAt:  row.created_at,
                        accessStatus:  row.access_status,
                    };

                    project = Project.build( newItem );

                    project.getProjectUsers().then(function (projectUsers) {

                    async.map(
                        projectUsers,
                        function (projectUser, puCallback) {
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
        return projectDaoService.getUserProject( userId, projectId, callback);
    };

    this.createCurrentUserProject = function(req, updateData, callback){
        userService.getCurrentUser(req, function (err, user) {
            if(err){
                return callback(err);
            }

            var project = Project.build(updateData);
            user.addProject(project).then(function(project) {
                project.addProjectUser(user, {role: ProjectUser.roles.ROLE_OWNER}).then(function () {
                    return callback(null, project);
                }).catch(function (e) {
                    return callback(e);
                });
            }).catch(function (e) {
                return callback(e);
            });
        });
    };

    this.updateCurrentUserProject = function(req, projectId, updateData, callback){

        var userId = req.redisSession.data.userId;

        projectDaoService.getUserProject( userId, projectId, function (err, project) {
            if(err){
                return callback( err );
            }

            if(updateData.name != undefined){
                project.name = updateData.name;
            }
            if(updateData.description != undefined){
                project.description = updateData.description;
            }

            project.save().then(function (updatedProject) {
                return callback(null, updatedProject);
            }).catch(function (error) {
                return callback( error );
            });
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

    this.addProjectUser = function(req, projectId, userData, cb) {
        async.waterfall([
            function(callback) {
                userService.getCurrentUser(req, function(err, currentUser) {
                    if (err) {
                        return cb(err);
                    }

                    return callback(null, currentUser);
                });
            },

            function(currentUser, callback) {
                self.getProject(req, projectId, function(err, project) {
                    if (err) {
                        return callback(err);
                    }

                    return callback(null, currentUser, project);
                });
            },

            function(currentUser, project, callback) {
                project.getProjectUserRelations().then(function(projectUsers) {
                    var isOwner = false;
                    projectUsers.forEach(function(projectUser) {
                        console.log(projectUser);
                        console.log(projectUser.userId);
                        console.log(currentUser.id);
                        if (projectUser.userId == currentUser.id && projectUser.role == ProjectUser.roles.ROLE_OWNER) {
                            isOwner = true;
                        }
                    });

                    if (!isOwner) {
                        return callback({
                            message: 'Not allowed to add users.'
                        })
                    }

                    return callback(null, project);
                });
            },

            function(project, callback) {
                 userService.getUser(req, userData.userId, function(err, user) {
                     if (err) {
                         return callback(err);
                     }
                     project.hasProjectUser(user).then(function(result) {
                         if (!result) {
                             var role = (userData.role !== undefined ? userData.role : ProjectUser.roles.ROLE_EDITOR);

                             // Add user
                             project.addProjectUser(user, {role: role}).then(function() {
                                 notificationService.addNotification(user.id, NotificationType.codes.PROJECT_USER_ADDED, project.id, function(error, notification) {
                                 });
                                 return callback(null, project);
                             });
                         } else {
                             return callback('User is already added to this project.');
                         }
                     }).catch(function(error) {
                         return callback({
                             message: error.message,
                             code: 500
                         })
                     });
                 });
            }

        ], cb);
    };

    this.removeProjectUser = function(req, projectId, userData, cb) {

        async.waterfall([
            function(callback) {
                userService.getCurrentUser(req, function(err, currentUser) {
                    if (err) {
                        return cb(err);
                    }

                    return callback(null, currentUser);
                });
            },

            function(currentUser, callback) {
                self.getProject(req, projectId, function(err, project) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, currentUser, project);
                });
            },

            function(currentUser, project, callback) {
                project.getProjectUserRelations().then(function(projectUsers) {
                    var isOwner = false;
                    projectUsers.forEach(function(projectUser) {
                        if (projectUser.userId == currentUser.id && projectUser.role == ProjectUser.roles.ROLE_OWNER) {
                            isOwner = true;
                        }
                    });

                    if (!isOwner) {
                        return callback({
                            message: 'Not allowed to remove users.'
                        })
                    }

                    return callback(null, currentUser, project);
                });
            },

            function(currentUser, project, callback) {
                userService.getUser(req, userData.userId, function(err, user) {
                    if (err) {
                        return callback(err);
                    }

                    if (currentUser.id == user.id) {
                        return callback({
                            message: 'Owner cannot remove himself.'
                        })
                    }

                    project.hasProjectUser(user).then(function(result) {
                        if (result) {
                            // Remove user
                            project.removeProjectUser(user).then(function() {
                                return callback(null, project);
                            });
                        } else {
                            return callback({
                                message: 'User is not added to this project.'
                            });
                        }
                    }).catch(function(error) {
                        return callback({
                            message: error.message,
                            code: 500
                        })
                    });
                });
            }

        ], cb);
    }
}

module.exports = new ProjectService();