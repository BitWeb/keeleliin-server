/**
 * Created by priit on 9.06.15.
 */

var logger = require('log4js').getLogger('project_service');
var projectDaoService = require('./dao/projectDaoService');
var Project = require(__base + 'src/service/dao/sql').Project;

function ProjectService(){

    this.createNewProjectForUser = function(projectData, user, callback){

        Project.create(projectData, ['name', 'description']).then(function (project) {
            user.addProject( project).then(function () {
                callback(null, project);
            });
        });
    };

    this.getCurrentUserProjects = function (req, callback) {

        var userId = req.redisSession.data.userId;
        return projectDaoService.getUserProjects( userId, callback);
    };

    this.getCurrentUserProject = function (req, projectId, callback) {

        var userId = req.redisSession.data.userId;
        return projectDaoService.getUserProject( userId, projectId, callback);
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
                return callback( error.message );
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