/**
 * Created by priit on 9.06.15.
 */

var logger = require('log4js').getLogger('project_service');
var projectDaoService = require('./dao/projectDaoService');
var Project = require(__base + 'src/service/dao/sql').Project;
var userService = require('./userService');

function ProjectService(){

    this.getCurrentUserProjects = function (req, callback) {

        var userId = req.redisSession.data.userId;
        return projectDaoService.getUserProjects( userId, callback);
    };

    this.getCurrentUserProject = function (req, projectId, callback) {

        var userId = req.redisSession.data.userId;
        return projectDaoService.getUserProject( userId, projectId, callback);
    };

    this.createCurrentUserProject = function(req, updateData, callback){

        console.log("userService");
        console.log(userService);


        userService.getCurrentUser(req, function (err, user) {
            if(err){
                return callback(err);
            }

            var project = Project.build(updateData );

            user.addProject( project).then(function () {
                return callback(null, project);
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
    }
}

module.exports = new ProjectService();